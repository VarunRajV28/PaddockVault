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
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

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
    public_key = db.Column(db.Text, nullable=False)  # RSA public key in PEM format
    private_key = db.Column(db.Text, nullable=False)  # RSA private key in PEM format
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
        
        # Generate RSA key pair (2048-bit)
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Serialize keys to PEM format
        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        self.public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

# TelemetryData Model
class TelemetryData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    owner_team = db.Column(db.String(50), nullable=False)
    classification = db.Column(db.String(20), nullable=False)  # 'Confidential' or 'Public'
    content = db.Column(db.Text, nullable=True)  # Encrypted content (Base64)
    nonce = db.Column(db.Text, nullable=True)  # GCM nonce (Base64)
    encrypted_aes_key = db.Column(db.Text, nullable=True)  # AES key encrypted with owner's RSA public key (Base64)
    digital_signature = db.Column(db.Text, nullable=True)  # RSA-SHA256 signature of plaintext (Base64)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'owner_team': self.owner_team,
            'classification': self.classification,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# SharedAccess Model
class SharedAccess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('telemetry_data.id'), nullable=False)
    shared_with_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    encrypted_key = db.Column(db.Text, nullable=False)  # File's key encrypted with recipient's public key
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'shared_with_user_id': self.shared_with_user_id,
            'encrypted_key': self.encrypted_key,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

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
            password=generate_password_hash(user_data['password']),  # Hash the password
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

def encrypt_aes_gcm(plaintext, rsa_public_key_pem):
    """
    Encrypt plaintext using AES-GCM and wrap the AES key with RSA public key
    
    Args:
        plaintext (str): The content to encrypt
        rsa_public_key_pem (str): RSA public key in PEM format
    
    Returns:
        dict: {
            'ciphertext': Base64-encoded encrypted content,
            'encrypted_key': Base64-encoded RSA-encrypted AES key,
            'nonce': Base64-encoded GCM nonce
        }
    """
    # Generate random 32-byte AES key and 12-byte nonce
    aes_key = os.urandom(32)
    nonce = os.urandom(12)
    
    # Encrypt plaintext using AES-GCM
    cipher = Cipher(
        algorithms.AES(aes_key),
        modes.GCM(nonce),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
    
    # Get the authentication tag
    tag = encryptor.tag
    
    # Combine ciphertext and tag
    ciphertext_with_tag = ciphertext + tag
    
    # Load RSA public key
    public_key = serialization.load_pem_public_key(
        rsa_public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
    # Encrypt AES key using RSA with PKCS1v15 padding
    encrypted_aes_key = public_key.encrypt(
        aes_key,
        padding.PKCS1v15()
    )
    
    # Return Base64-encoded values
    return {
        'ciphertext': base64.b64encode(ciphertext_with_tag).decode('utf-8'),
        'encrypted_key': base64.b64encode(encrypted_aes_key).decode('utf-8'),
        'nonce': base64.b64encode(nonce).decode('utf-8')
    }


def sign_data(private_key_pem, data):
    """
    Sign data using RSA-SHA256 digital signature
    
    Args:
        private_key_pem (str): RSA private key in PEM format
        data (str): The plaintext data to sign
    
    Returns:
        str: Base64-encoded signature
    """
    # Load private key
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
    # Sign the data using RSA-SHA256 with PSS padding
    signature = private_key.sign(
        data.encode('utf-8'),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    # Return Base64-encoded signature
    return base64.b64encode(signature).decode('utf-8')


def verify_signature(public_key_pem, data, signature_b64):
    """
    Verify RSA-SHA256 digital signature
    
    Args:
        public_key_pem (str): RSA public key in PEM format
        data (str): The plaintext data that was signed
        signature_b64 (str): Base64-encoded signature
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        # Load public key
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
        
        # Decode signature
        signature = base64.b64decode(signature_b64)
        
        # Verify signature using RSA-SHA256 with PSS padding
        public_key.verify(
            signature,
            data.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return True
    except Exception as e:
        print(f"Signature verification failed: {str(e)}")
        return False

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
    new_user = User(username=username, password=generate_password_hash(password), team=team)
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
    
    if not user or not check_password_hash(user.password, password):
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

@app.route('/api/seed', methods=['POST'])
def seed_telemetry():
    """Seed the database with exactly 3 test telemetry objects (encrypted)"""
    try:
        # Wipe all existing telemetry data
        TelemetryData.query.delete()
        
        # Define test data with plaintext content
        test_data = [
            {
                'filename': 'ferrari_strategy_monza.json',
                'owner_team': 'ferrari',
                'classification': 'Confidential',
                'plaintext': '{"strategy": "two-stop", "tire_compound": "soft-medium-soft", "fuel_load": "105kg"}'
            },
            {
                'filename': 'redbull_engine_map.json',
                'owner_team': 'redbull',
                'classification': 'Confidential',
                'plaintext': '{"engine_mode": "qualifying", "ers_deployment": "aggressive", "power_unit": "Honda RBPT"}'
            },
            {
                'filename': 'fia_race_regulations.pdf',
                'owner_team': 'fia',
                'classification': 'Public',
                'plaintext': '{"regulation": "2024 Technical Regulations", "version": "1.0", "effective_date": "2024-01-01"}'
            }
        ]
        
        # Encrypt and insert each file
        for data in test_data:
            # Get owner's public key
            owner_user = User.query.filter_by(team=data['owner_team']).first()
            if not owner_user:
                raise Exception(f"Owner user not found for team: {data['owner_team']}")
            
            # Sign the plaintext using owner's private key
            signature = sign_data(owner_user.private_key, data['plaintext'])
            
            # Encrypt content using AES-GCM
            encrypted_data = encrypt_aes_gcm(data['plaintext'], owner_user.public_key)
            
            # Create telemetry object with encrypted data and signature
            telemetry_obj = TelemetryData(
                filename=data['filename'],
                owner_team=data['owner_team'],
                classification=data['classification'],
                content=encrypted_data['ciphertext'],
                nonce=encrypted_data['nonce'],
                encrypted_aes_key=encrypted_data['encrypted_key'],
                digital_signature=signature
            )
            db.session.add(telemetry_obj)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Telemetry data seeded successfully with AES-GCM encryption',
            'count': len(test_data)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to seed data',
            'details': str(e)
        }), 500

@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    """Get telemetry data with access control based on user's team"""
    try:
        # Extract user identity from headers
        user_team = request.headers.get('X-User-Team', '').lower()
        user_name = request.headers.get('X-User-Name', '')
        
        if not user_team:
            return jsonify({'error': 'Missing user team header'}), 400
        
        print(f"Telemetry access request - User: {user_name}, Team: {user_team}")  # Debug log
        
        # Get current user
        current_user = User.query.filter_by(username=user_name, team=user_team).first()
        
        # The Bouncer Logic
        if user_team == 'fia':
            # FIA Admin: Return ALL files
            telemetry_files = TelemetryData.query.all()
            print(f"FIA access granted - returning {len(telemetry_files)} files")
        else:
            # Team Principal: Return their team's files + Public files + Shared files
            if current_user:
                # Get file IDs that have been shared with this user
                shared_file_ids = db.session.query(SharedAccess.file_id).filter(
                    SharedAccess.shared_with_user_id == current_user.id
                ).all()
                shared_file_ids = [fid[0] for fid in shared_file_ids]
                
                # Query: Own team's files OR Public files OR Shared files
                telemetry_files = TelemetryData.query.filter(
                    db.or_(
                        TelemetryData.owner_team == user_team,  # Own team's files
                        TelemetryData.classification == 'Public',  # Public files
                        TelemetryData.id.in_(shared_file_ids) if shared_file_ids else False  # Shared files
                    )
                ).all()
            else:
                # Fallback if user not found
                telemetry_files = TelemetryData.query.filter(
                    db.or_(
                        TelemetryData.owner_team == user_team,
                        TelemetryData.classification == 'Public'
                    )
                ).all()
            print(f"Team {user_team} access - returning {len(telemetry_files)} files")
        
        # Convert to dict format
        result = [file.to_dict() for file in telemetry_files]
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in get_telemetry: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve telemetry data',
            'details': str(e)
        }), 500


@app.route('/api/telemetry/share', methods=['POST'])
def share_telemetry():
    """Share a telemetry file with another team using RSA key exchange"""
    try:
        data = request.get_json()
        
        file_id = data.get('file_id')
        recipient_team = data.get('recipient_team', '').lower()
        sender_username = data.get('sender_username', '').lower()
        
        if not all([file_id, recipient_team, sender_username]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        print(f"Share request - File: {file_id}, From: {sender_username}, To: {recipient_team}")
        
        # 1. Authorization: Verify sender owns the file
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
        sender_user = User.query.filter_by(username=sender_username).first()
        if not sender_user:
            return jsonify({'error': 'Sender not found'}), 404
        
        if telemetry_file.owner_team != sender_user.team:
            return jsonify({'error': 'Unauthorized: You do not own this file'}), 403
        
        # 2. Recipient Lookup: Find a user from the recipient team
        recipient_user = User.query.filter_by(team=recipient_team).first()
        if not recipient_user:
            return jsonify({'error': f'No user found for team {recipient_team}'}), 404
        
        # 3. Check if already shared
        existing_share = SharedAccess.query.filter_by(
            file_id=file_id,
            shared_with_user_id=recipient_user.id
        ).first()
        if existing_share:
            return jsonify({'error': 'File already shared with this team'}), 409
        
        # 4. RSA Encryption: Encrypt dummy AES key with recipient's public key
        dummy_aes_key = "AES_KEY_SECRET_123"
        
        # Load recipient's public key
        recipient_public_key = serialization.load_pem_public_key(
            recipient_user.public_key.encode('utf-8'),
            backend=default_backend()
        )
        
        # Encrypt using RSA with PKCS1v15 padding
        encrypted_key = recipient_public_key.encrypt(
            dummy_aes_key.encode('utf-8'),
            padding.PKCS1v15()
        )
        
        # Base64 encode for storage
        encrypted_key_b64 = base64.b64encode(encrypted_key).decode('utf-8')
        
        # 5. Save to SharedAccess table
        new_share = SharedAccess(
            file_id=file_id,
            shared_with_user_id=recipient_user.id,
            encrypted_key=encrypted_key_b64
        )
        db.session.add(new_share)
        db.session.commit()
        
        print(f"✓ File {file_id} shared with {recipient_team} (User ID: {recipient_user.id})")
        
        return jsonify({
            'success': True,
            'message': f'File successfully shared with {recipient_team.upper()}',
            'encrypted_key_length': len(encrypted_key_b64)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in share_telemetry: {str(e)}")
        return jsonify({
            'error': 'Failed to share file',
            'details': str(e)
        }), 500

@app.route('/api/telemetry/decrypt', methods=['POST'])
def decrypt_telemetry():
    """Decrypt a telemetry file using the user's RSA private key"""
    try:
        data = request.get_json()
        
        file_id = data.get('file_id')
        username = data.get('username', '').lower()
        
        if not all([file_id, username]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        print(f"Decrypt request - File: {file_id}, User: {username}")
        
        # 1. Get the telemetry file
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
        # 2. Get the requesting user
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # 3. Authorization: Check if user is owner OR has shared access
        is_owner = telemetry_file.owner_team == user.team
        shared_access = None
        
        if not is_owner:
            shared_access = SharedAccess.query.filter_by(
                file_id=file_id,
                shared_with_user_id=user.id
            ).first()
            
            if not shared_access:
                return jsonify({'error': 'Unauthorized: You do not have access to this file'}), 403
        
        # 4. Get the encrypted AES key
        if is_owner:
            encrypted_aes_key_b64 = telemetry_file.encrypted_aes_key
            print(f"Owner access - using file's encrypted key")
        else:
            encrypted_aes_key_b64 = shared_access.encrypted_key
            print(f"Shared access - using shared encrypted key")
        
        if not encrypted_aes_key_b64:
            return jsonify({'error': 'Encrypted key not found'}), 500
        
        # 5. Decrypt the AES key using user's RSA private key
        encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
        
        # Load user's private key
        private_key = serialization.load_pem_private_key(
            user.private_key.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        # Decrypt AES key
        try:
            aes_key = private_key.decrypt(
                encrypted_aes_key,
                padding.PKCS1v15()
            )
        except Exception as e:
            print(f"RSA decryption failed: {str(e)}")
            return jsonify({'error': 'Failed to decrypt AES key: Invalid RSA key'}), 500
        
        # 6. Decrypt the content using AES-GCM
        ciphertext_with_tag = base64.b64decode(telemetry_file.content)
        nonce = base64.b64decode(telemetry_file.nonce)
        
        # Split ciphertext and tag (last 16 bytes are the tag)
        ciphertext = ciphertext_with_tag[:-16]
        tag = ciphertext_with_tag[-16:]
        
        # Create cipher and decrypt
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(nonce, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        try:
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            decrypted_content = plaintext.decode('utf-8')
        except Exception as e:
            print(f"AES-GCM decryption failed: {str(e)}")
            return jsonify({'error': 'Failed to decrypt content: Invalid key or corrupted data'}), 500
        
        print(f"✓ File {file_id} decrypted successfully for {username}")
        
        return jsonify({
            'success': True,
            'content': decrypted_content
        }), 200
        
    except Exception as e:
        print(f"Error in decrypt_telemetry: {str(e)}")
        return jsonify({
            'error': 'Failed to decrypt file',
            'details': str(e)
        }), 500


@app.route('/api/telemetry/verify', methods=['POST'])
def verify_telemetry():
    """Verify a telemetry file's digital signature"""
    try:
        data = request.get_json()
        
        file_id = data.get('file_id')
        username = data.get('username', '').lower()
        
        if not all([file_id, username]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        print(f"Verify request - File: {file_id}, User: {username}")
        
        # 1. Get the telemetry file
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
        # 2. Get the requesting user
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # 3. Authorization: Check if user is owner OR has shared access
        is_owner = telemetry_file.owner_team == user.team
        shared_access = None
        
        if not is_owner:
            shared_access = SharedAccess.query.filter_by(
                file_id=file_id,
                shared_with_user_id=user.id
            ).first()
            
            if not shared_access:
                return jsonify({'error': 'Unauthorized: You do not have access to this file'}), 403
        
        # 4. Get the encrypted AES key
        if is_owner:
            encrypted_aes_key_b64 = telemetry_file.encrypted_aes_key
        else:
            encrypted_aes_key_b64 = shared_access.encrypted_key
        
        if not encrypted_aes_key_b64:
            return jsonify({'error': 'Encrypted key not found'}), 500
        
        # 5. Decrypt the AES key using user's RSA private key
        encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
        
        private_key = serialization.load_pem_private_key(
            user.private_key.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        try:
            aes_key = private_key.decrypt(
                encrypted_aes_key,
                padding.PKCS1v15()
            )
        except Exception as e:
            print(f"RSA decryption failed: {str(e)}")
            return jsonify({'error': 'Failed to decrypt AES key'}), 500
        
        # 6. Decrypt the content using AES-GCM
        ciphertext_with_tag = base64.b64decode(telemetry_file.content)
        nonce = base64.b64decode(telemetry_file.nonce)
        
        ciphertext = ciphertext_with_tag[:-16]
        tag = ciphertext_with_tag[-16:]
        
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(nonce, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        try:
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            decrypted_content = plaintext.decode('utf-8')
        except Exception as e:
            print(f"AES-GCM decryption failed: {str(e)}")
            return jsonify({'error': 'Failed to decrypt content'}), 500
        
        # 7. Get owner's public key for signature verification
        owner_user = User.query.filter_by(team=telemetry_file.owner_team).first()
        if not owner_user:
            return jsonify({'error': 'Owner user not found'}), 500
        
        # 8. Verify the digital signature
        if not telemetry_file.digital_signature:
            return jsonify({'error': 'No digital signature found'}), 500
        
        is_valid = verify_signature(
            owner_user.public_key,
            decrypted_content,
            telemetry_file.digital_signature
        )
        
        print(f"✓ Signature verification for file {file_id}: {'VALID' if is_valid else 'INVALID'}")
        
        return jsonify({
            'valid': is_valid,
            'owner': telemetry_file.owner_team
        }), 200
        
    except Exception as e:
        print(f"Error in verify_telemetry: {str(e)}")
        return jsonify({
            'error': 'Failed to verify file',
            'details': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
