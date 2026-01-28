# Flask Backend for F1 Telemetry Dashboard

This is the backend API for the F1 Telemetry Dashboard with TOTP 2FA support.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Default Users

The following users are created automatically with TOTP enabled:
- Username: `admin`, Password: `fia123`, Team: `fia`
- Username: `admin`, Password: `ferrari123`, Team: `ferrari`
- Username: `admin`, Password: `mclaren123`, Team: `mclaren`
- Username: `admin`, Password: `redbull123`, Team: `redbull`

## API Endpoints

- `POST /api/register` - Register new user and get QR code
- `POST /api/login` - Login with username/password
- `POST /api/verify-2fa` - Verify TOTP code
- `POST /api/get-qr-code` - Get QR code for existing user
- `GET /api/health` - Health check

## TOTP Setup

Each user has a unique TOTP secret. Use Google Authenticator or any TOTP-compatible app to scan the QR code during registration or re-setup.
