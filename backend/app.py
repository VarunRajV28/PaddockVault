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

               
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-this'                        

db = SQLAlchemy(app)

   #component 1         
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    password = db.Column(db.String(200), nullable=False)                             
    team = db.Column(db.String(50), nullable=False)
    totp_secret = db.Column(db.String(32), nullable=False)
    public_key = db.Column(db.Text, nullable=False)                                
    private_key = db.Column(db.Text, nullable=False)                                 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
                                                    
    __table_args__ = (
        db.UniqueConstraint('username', 'team', name='unique_username_team'),
    )

    def __init__(self, username, password, team):
        self.username = username
        self.password = password                                   
        self.team = team
        self.totp_secret = pyotp.random_base32()
        
                                          
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
                                      
        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        self.public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

                     
class TelemetryData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    owner_team = db.Column(db.String(50), nullable=False)
    classification = db.Column(db.String(20), nullable=False)                              
    content = db.Column(db.Text, nullable=True)                              
    nonce = db.Column(db.Text, nullable=True)                      
    encrypted_aes_key = db.Column(db.Text, nullable=True)                                                          
    digital_signature = db.Column(db.Text, nullable=True)                                              
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

                    
class SharedAccess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('telemetry_data.id'), nullable=False)
    shared_with_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    encrypted_key = db.Column(db.Text, nullable=False)                                                    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'shared_with_user_id': self.shared_with_user_id,
            'encrypted_key': self.encrypted_key,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

                
class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(200), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user': self.user,
            'action': self.action
        }

               
with app.app_context():
                                                          
    db.drop_all()
    db.create_all()
    
                                                     
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
            password=generate_password_hash(user_data['password']),                     
            team=user_data['team']
        )
        db.session.add(new_user)
    
    db.session.commit()
#component 1.2
def generate_qr_code_base64(secret, username, issuer='F1 Telemetry'):
    """Generate a QR code for TOTP setup"""
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name=issuer
    )
    
                    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
                                        
    img = qr.make_image(fill_color="black", back_color="white")
    
                       
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
                                                       
    aes_key = os.urandom(32)
    nonce = os.urandom(12)
    
                                     
    cipher = Cipher(
        algorithms.AES(aes_key),
        modes.GCM(nonce),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
    
                                
    tag = encryptor.tag
    
                                
    ciphertext_with_tag = ciphertext + tag
    
                         
    public_key = serialization.load_pem_public_key(
        rsa_public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
                                                     
    encrypted_aes_key = public_key.encrypt(
        aes_key,
        padding.PKCS1v15()
    )
    
                                  
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
                      
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
                                                     
    signature = private_key.sign(
        data.encode('utf-8'),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
                                     
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
                         
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
        
                          
        signature = base64.b64decode(signature_b64)
        
                                                            
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

def log_audit_event(user, action):
    """Log an audit event to the database"""
    try:
        log_entry = AuditLog(user=user, action=action)
        db.session.add(log_entry)
        db.session.commit()
        print(f"✓ Audit log: {user} - {action}")
    except Exception as e:
        print(f"Failed to log audit event: {str(e)}")
        db.session.rollback()

def generate_token(user_id, username):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user and return QR code"""
    data = request.get_json()
    
    team = data.get('team')
    password = data.get('password')
    
    if not all([team, password]):
        return jsonify({'error': 'Missing required fields'}), 400
    
                               
    username = team
    
                                  
    existing_user = User.query.filter_by(username=username, team=team).first()
    if existing_user:
        return jsonify({'error': 'Team already registered'}), 409
    
                                      
    new_user = User(username=username, password=generate_password_hash(password), team=team)
    db.session.add(new_user)
    db.session.commit()
    
                      
    qr_code = generate_qr_code_base64(new_user.totp_secret, username, f'F1 Telemetry - {team.upper()}')
    
    return jsonify({
        'success': True,
        'message': 'Team registered successfully',
        'qr_code': qr_code,
        'secret': new_user.totp_secret                                            
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Verify username/password and indicate if MFA is required"""
    data = request.get_json()
    
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'error': 'Missing credentials'}), 400
    
                                           
    user = User.query.filter_by(username=username, team=username).first()
    #component 1
    if not user or not check_password_hash(user.password, password):
        log_audit_event(username, 'Failed Login Attempt')
        return jsonify({'error': 'Invalid credentials'}), 401
    
                          
    log_audit_event(username, 'User Logged In')
    
                                                                                          
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
    
    print(f"Verification request - user_id: {user_id}, code: {code}")             
    
    if not all([user_id, code]):
        return jsonify({'error': 'Missing verification data'}), 400
    
               
    user = User.query.get(user_id)
    
    if not user:
        print(f"User not found with id: {user_id}")             
        return jsonify({'error': 'User not found'}), 404
    
    print(f"User found - username: {user.username}, team: {user.team}, secret: {user.totp_secret}")             
    
                      
    totp = pyotp.TOTP(user.totp_secret)
    current_code = totp.now()
    print(f"Expected code: {current_code}, Received code: {code}")             
    
    is_valid = totp.verify(code, valid_window=1)                                  
    
    if not is_valid:
        print(f"Code verification failed")             
        return jsonify({'error': 'Invalid verification code'}), 401
    
                        
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
    
                           
    user = User.query.filter_by(username=team, team=team).first()
    
    if not user:
        return jsonify({'error': 'Team not found'}), 404
    
                      
    qr_code = generate_qr_code_base64(user.totp_secret, team, f'F1 Telemetry - {team.upper()}')
    
    return jsonify({
        'success': True,
        'qr_code': qr_code
    }), 200

@app.route('/api/seed', methods=['POST'])
def seed_telemetry():
    """Seed the database with exactly 3 test telemetry objects (encrypted)"""
    try:
                                          
        TelemetryData.query.delete()
        
                                                 
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
        
                                      
        for data in test_data:
                                    
            owner_user = User.query.filter_by(team=data['owner_team']).first()
            if not owner_user:
                raise Exception(f"Owner user not found for team: {data['owner_team']}")
            
                                                          
            signature = sign_data(owner_user.private_key, data['plaintext'])
            
                                           
            encrypted_data = encrypt_aes_gcm(data['plaintext'], owner_user.public_key)
            
                                                                       
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
        
                              
        log_audit_event('System', 'Database Seeded')
        
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
                                            
        user_team = request.headers.get('X-User-Team', '').lower()
        user_name = request.headers.get('X-User-Name', '')
        
        if not user_team:
            return jsonify({'error': 'Missing user team header'}), 400
        
        print(f"Telemetry access request - User: {user_name}, Team: {user_team}")             
        
                          
        current_user = User.query.filter_by(username=user_name, team=user_team).first()
        
                           
        if user_team == 'fia':
                                         
            telemetry_files = TelemetryData.query.all()
            print(f"FIA access granted - returning {len(telemetry_files)} files")
        else:
                                                                                     
            if current_user:
                                                                   
                shared_file_ids = db.session.query(SharedAccess.file_id).filter(
                    SharedAccess.shared_with_user_id == current_user.id
                ).all()
                shared_file_ids = [fid[0] for fid in shared_file_ids]
                
                #component 2.1                                                         
                telemetry_files = TelemetryData.query.filter(
                    db.or_(
                        TelemetryData.owner_team == user_team,                    
                        TelemetryData.classification == 'Public',                
                        TelemetryData.id.in_(shared_file_ids) if shared_file_ids else False                
                    )
                ).all()
            else:
                                            
                telemetry_files = TelemetryData.query.filter(
                    db.or_(
                        TelemetryData.owner_team == user_team,
                        TelemetryData.classification == 'Public'
                    )
                ).all()
            print(f"Team {user_team} access - returning {len(telemetry_files)} files")
        
                              
        log_audit_event(user_name if user_name else user_team, 'Accessed Telemetry Repository')
        
                                
        result = [file.to_dict() for file in telemetry_files]
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in get_telemetry: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve telemetry data',
            'details': str(e)
        }), 500


@app.route('/api/telemetry/upload', methods=['POST'])
def upload_telemetry():
    """Upload, sign, and encrypt a new telemetry file"""
    try:
        data = request.get_json()
        
        filename = data.get('filename')
        content = data.get('content')
        classification = data.get('classification')
        target_team = data.get('target_team', '').lower()
        
                                                             
        username = request.headers.get('X-User-Name')
        team = request.headers.get('X-User-Team').lower()
        
        if not all([filename, content, classification, username, team]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        print(f"Upload request - File: {filename}, User: {username}, Team: {team}")
        
                                           
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
                                         
                                                                    
        signature = sign_data(user.private_key, content)
        
                                                  
                                                                                    
        encrypted_data = encrypt_aes_gcm(content, user.public_key)
        
                             
        new_file = TelemetryData(
            filename=filename,
            owner_team=team,
            classification=classification,
            content=encrypted_data['ciphertext'],
            nonce=encrypted_data['nonce'],
            encrypted_aes_key=encrypted_data['encrypted_key'],
            digital_signature=signature
        )
        
        db.session.add(new_file)
        db.session.flush()                                
        
                                                        
        shared_msg = ""
        if target_team:
            recipient_user = User.query.filter_by(team=target_team).first()
            if recipient_user:
                                                                               
                                                                                        
                private_key = serialization.load_pem_private_key(
                    user.private_key.encode('utf-8'),
                    password=None,
                    backend=default_backend()
                )
                
                                                                
                aes_key = private_key.decrypt(
                    base64.b64decode(encrypted_data['encrypted_key']),
                    padding.PKCS1v15()
                )
                
                                                            
                recipient_public_key = serialization.load_pem_public_key(
                    recipient_user.public_key.encode('utf-8'),
                    backend=default_backend()
                )
                
                shared_encrypted_key = recipient_public_key.encrypt(
                    aes_key,
                    padding.PKCS1v15()
                )
                
                                            
                share = SharedAccess(
                    file_id=new_file.id,
                    shared_with_user_id=recipient_user.id,
                    encrypted_key=base64.b64encode(shared_encrypted_key).decode('utf-8')
                )
                db.session.add(share)
                shared_msg = f" and shared with {target_team}"
                
                                 
                log_audit_event(username, f'Shared {filename} with {target_team}')
            else:
                print(f"Warning: Target team {target_team} not found for sharing")

        db.session.commit()
        
                      
        log_audit_event(username, f'Uploaded file: {filename}{shared_msg}')
        
        return jsonify({
            'success': True,
            'file_id': new_file.id,
            'message': f'File encrypted and uploaded successfully{shared_msg}'
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in upload_telemetry: {str(e)}")
        return jsonify({'error': 'Failed to upload file'}), 500


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
        
                                                       
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
        sender_user = User.query.filter_by(username=sender_username).first()
        if not sender_user:
            return jsonify({'error': 'Sender not found'}), 404
        
        if telemetry_file.owner_team != sender_user.team:
            return jsonify({'error': 'Unauthorized: You do not own this file'}), 403
        
                                                                  
        recipient_user = User.query.filter_by(team=recipient_team).first()
        if not recipient_user:
            return jsonify({'error': f'No user found for team {recipient_team}'}), 404
        
                                    
        existing_share = SharedAccess.query.filter_by(
            file_id=file_id,
            shared_with_user_id=recipient_user.id
        ).first()
        if existing_share:
            return jsonify({'error': 'File already shared with this team'}), 409
        
        # 4. RSA Encryption: Secure handshake
        # Step A: Unwrap (Decrypt) the original AES key using Sender's Private Key
        try:
            sender_private_key = serialization.load_pem_private_key(
                sender_user.private_key.encode('utf-8'),
                password=None,
                backend=default_backend()
            )
            
            # The file's key is encrypted with the Owner's Public Key.
            # Since we verified sender is owner/authorized, we use their private key.
            # (Note: If sender is NOT owner but has shared access, we'd need to use the SharedAccess key.
            # But earlier check ensures owner_team == sender_team, so sender has access to owner's key or is owner.)
            # Wait, if multiple users are in a team, they share the team's key pair? 
            # The User model has individual keys, but the 'team' concept implies shared access?
            # Looking at User model: "username" seems to be user/team name alias in this simplified app.
            
            original_encrypted_key = base64.b64decode(telemetry_file.encrypted_aes_key)
            
            raw_aes_key = sender_private_key.decrypt(
                original_encrypted_key,
                padding.PKCS1v15()
            )
            
        except Exception as e:
            print(f"Key Unwrap Failed: {str(e)}")
            return jsonify({'error': 'Failed to decrypt source file key. Sender key mismatch?'}), 500

        # Step B: Wrap (Encrypt) the AES key for the Recipient
        recipient_public_key = serialization.load_pem_public_key(
            recipient_user.public_key.encode('utf-8'),
            backend=default_backend()
        )
        #component 2.2 
        encrypted_key = recipient_public_key.encrypt(
            raw_aes_key,
            padding.PKCS1v15()
        )
        
        # Base64 encode for storage
        encrypted_key_b64 = base64.b64encode(encrypted_key).decode('utf-8')
        
                                       
        new_share = SharedAccess(
            file_id=file_id,
            shared_with_user_id=recipient_user.id,
            encrypted_key=encrypted_key_b64
        )
        db.session.add(new_share)
        db.session.commit()
        
        print(f"✓ File {file_id} shared with {recipient_team} (User ID: {recipient_user.id})")
        
                            
        log_audit_event(sender_username, f'Shared {telemetry_file.filename} with {recipient_team}')
        
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
        
                                   
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
                                    
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
                                                                       
        is_owner = telemetry_file.owner_team == user.team
        shared_access = None
        
        if not is_owner:
            shared_access = SharedAccess.query.filter_by(
                file_id=file_id,
                shared_with_user_id=user.id
            ).first()
            
            if not shared_access:
                return jsonify({'error': 'Unauthorized: You do not have access to this file'}), 403
        
                                      
        if is_owner:
            encrypted_aes_key_b64 = telemetry_file.encrypted_aes_key
            print(f"Owner access - using file's encrypted key")
        else:
            encrypted_aes_key_b64 = shared_access.encrypted_key
            print(f"Shared access - using shared encrypted key")
        
        if not encrypted_aes_key_b64:
            return jsonify({'error': 'Encrypted key not found'}), 500
        
                                                             
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
            return jsonify({'error': 'Failed to decrypt AES key: Invalid RSA key'}), 500
        
                                              
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
            return jsonify({'error': 'Failed to decrypt content: Invalid key or corrupted data'}), 500
        
        print(f"✓ File {file_id} decrypted successfully for {username}")
        
                               
        log_audit_event(username, f'Decrypted content of {telemetry_file.filename}')
        
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
        
                                   
        telemetry_file = TelemetryData.query.get(file_id)
        if not telemetry_file:
            return jsonify({'error': 'File not found'}), 404
        
                                    
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
                                                                       
        is_owner = telemetry_file.owner_team == user.team
        shared_access = None
        
        if not is_owner:
            shared_access = SharedAccess.query.filter_by(
                file_id=file_id,
                shared_with_user_id=user.id
            ).first()
            
            if not shared_access:
                return jsonify({'error': 'Unauthorized: You do not have access to this file'}), 403
        
                                      
        if is_owner:
            encrypted_aes_key_b64 = telemetry_file.encrypted_aes_key
        else:
            encrypted_aes_key_b64 = shared_access.encrypted_key
        
        if not encrypted_aes_key_b64:
            return jsonify({'error': 'Encrypted key not found'}), 500
        
                                                             
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
        
                                                              
        owner_user = User.query.filter_by(team=telemetry_file.owner_team).first()
        if not owner_user:
            return jsonify({'error': 'Owner user not found'}), 500
        
                                         
        if not telemetry_file.digital_signature:
            return jsonify({'error': 'No digital signature found'}), 500
        
        is_valid = verify_signature(
            owner_user.public_key,
            decrypted_content,
            telemetry_file.digital_signature
        )
        
        print(f"✓ Signature verification for file {file_id}: {'VALID' if is_valid else 'INVALID'}")
        
                                 
        if is_valid:
            log_audit_event(username, f'Verified integrity of {telemetry_file.filename}')
        
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


@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics and recent audit logs"""
    try:
                                    
        node_count = User.query.count()
        
                               
        encrypted_count = TelemetryData.query.count()
        
                                
        recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(10).all()
        
        return jsonify({
            'nodes': node_count,
            'files': encrypted_count,
            'logs': [log.to_dict() for log in recent_logs]
        }), 200
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve dashboard stats',
            'details': str(e)
        }), 500


@app.route('/api/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get recent audit logs for the logs page"""
    try:
                                 
        logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
        return jsonify([log.to_dict() for log in logs]), 200
    except Exception as e:
        print(f"Error in get_audit_logs: {str(e)}")
        return jsonify({'error': 'Failed to retrieve audit logs'}), 500


    except Exception as e:
        print(f"Error in get_audit_logs: {str(e)}")
        return jsonify({'error': 'Failed to retrieve audit logs'}), 500


@app.route('/api/user/keys', methods=['GET'])
def get_user_keys():
    """Get the current user's public key based on headers"""
    try:
        user_team = request.headers.get('X-User-Team', '').lower()
        user_name = request.headers.get('X-User-Name', '')
        
        if not user_name:
            return jsonify({'error': 'Missing user identity'}), 400
            
        user = User.query.filter_by(username=user_name).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'username': user.username,
            'team': user.team,
            'public_key': user.public_key
        }), 200
        
    except Exception as e:
        print(f"Error in get_user_keys: {str(e)}")
        return jsonify({'error': 'Failed to retrieve user keys'}), 500


@app.route('/api/tools/hash', methods=['POST'])
def calculate_hash():
    """Calculate SHA-256 hash of provided text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
                                
        import hashlib
        hash_object = hashlib.sha256(text.encode('utf-8'))
        hex_dig = hash_object.hexdigest()
        
        return jsonify({'hash': hex_dig}), 200
        
    except Exception as e:
        print(f"Error in calculate_hash: {str(e)}")
        return jsonify({'error': 'Failed to calculate hash'}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
