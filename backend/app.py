from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
import jwt
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-this'  # Change in production

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    password = db.Column(db.String(200), nullable=False)  # In production, hash this!
    team = db.Column(db.String(50), nullable=False)
    totp_secret = db.Column(db.String(32), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Composite unique constraint on username + team
    __table_args__ = (
        db.UniqueConstraint('username', 'team', name='unique_username_team'),
    )

    def __init__(self, username, password, team):
        self.username = username
        self.password = password  # Remember to hash in production!
        self.team = team
        self.totp_secret = pyotp.random_base32()

# Create tables
with app.app_context():
    # Drop all tables and recreate (only for development!)
    db.drop_all()
    db.create_all()
    
    # Add default users with TOTP if they don't exist
    default_users = [
        {'username': 'fia', 'password': 'fia123', 'team': 'fia'},
        {'username': 'ferrari', 'password': 'ferrari123', 'team': 'ferrari'},
        {'username': 'mclaren', 'password': 'mclaren123', 'team': 'mclaren'},
        {'username': 'redbull', 'password': 'redbull123', 'team': 'redbull'},
        {'username': 'mercedes', 'password': 'mercedes123', 'team': 'mercedes'},
    ]
    
    for user_data in default_users:
        new_user = User(
            username=user_data['username'],
            password=user_data['password'],
            team=user_data['team']
        )
        db.session.add(new_user)
    
    db.session.commit()

def generate_qr_code_base64(secret, username, issuer='F1 Telemetry'):
    """Generate a QR code for TOTP setup"""
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name=issuer
    )
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    # Create image with white background
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def generate_token(user_id, username):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# Routes

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user and return QR code"""
    data = request.get_json()
    
    team = data.get('team')
    password = data.get('password')
    
    if not all([team, password]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Username is the team name
    username = team
    
    # Check if user already exists
    existing_user = User.query.filter_by(username=username, team=team).first()
    if existing_user:
        return jsonify({'error': 'Team already registered'}), 409
    
    # Create new user with TOTP secret
    new_user = User(username=username, password=password, team=team)
    db.session.add(new_user)
    db.session.commit()
    
    # Generate QR code
    qr_code = generate_qr_code_base64(new_user.totp_secret, username, f'F1 Telemetry - {team.upper()}')
    
    return jsonify({
        'success': True,
        'message': 'Team registered successfully',
        'qr_code': qr_code,
        'secret': new_user.totp_secret  # Only for debugging, remove in production
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Verify username/password and indicate if MFA is required"""
    data = request.get_json()
    
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'error': 'Missing credentials'}), 400
    
    # Find user (username is the team name)
    user = User.query.filter_by(username=username, team=username).first()
    
    if not user or user.password != password:  # In production, use proper password hashing
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Store user info in session (simplified, use proper session management in production)
    return jsonify({
        'success': True,
        'mfa_required': True,
        'user_id': user.id,
        'username': user.username,
        'team': user.team
    }), 200

@app.route('/api/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verify TOTP code and complete login"""
    data = request.get_json()
    
    user_id = data.get('user_id')
    username = data.get('username')
    team = data.get('team')
    code = data.get('code')
    
    print(f"Verification request - user_id: {user_id}, code: {code}")  # Debug log
    
    if not all([user_id, code]):
        return jsonify({'error': 'Missing verification data'}), 400
    
    # Find user
    user = User.query.get(user_id)
    
    if not user:
        print(f"User not found with id: {user_id}")  # Debug log
        return jsonify({'error': 'User not found'}), 404
    
    print(f"User found - username: {user.username}, team: {user.team}, secret: {user.totp_secret}")  # Debug log
    
    # Verify TOTP code
    totp = pyotp.TOTP(user.totp_secret)
    current_code = totp.now()
    print(f"Expected code: {current_code}, Received code: {code}")  # Debug log
    
    is_valid = totp.verify(code, valid_window=1)  # Allow 1 time step before/after
    
    if not is_valid:
        print(f"Code verification failed")  # Debug log
        return jsonify({'error': 'Invalid verification code'}), 401
    
    # Generate JWT token
    token = generate_token(user.id, user.username)
    
    return jsonify({
        'success': True,
        'message': 'Authentication successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'team': user.team
        }
    }), 200

@app.route('/api/get-qr-code', methods=['POST'])
def get_qr_code():
    """Get QR code for existing user (for re-setup)"""
    data = request.get_json()
    
    team = data.get('team')
    
    if not team:
        return jsonify({'error': 'Missing team'}), 400
    
    # Username is team name
    user = User.query.filter_by(username=team, team=team).first()
    
    if not user:
        return jsonify({'error': 'Team not found'}), 404
    
    # Generate QR code
    qr_code = generate_qr_code_base64(user.totp_secret, team, f'F1 Telemetry - {team.upper()}')
    
    return jsonify({
        'success': True,
        'qr_code': qr_code
    }), 200

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
