# F1 Telemetry Dashboard - TOTP 2FA Implementation

This document provides complete setup instructions for the TOTP Two-Factor Authentication system.

## Overview

The system implements Google Authenticator-compatible TOTP (Time-based One-Time Password) authentication with:
- Flask backend with SQLite database
- Next.js frontend with dark mode UI
- QR code generation for easy setup
- Auto-verification on 6-digit code entry

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Google Authenticator app (or any TOTP-compatible app)

## Backend Setup

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Create and activate virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Flask server

```bash
python app.py
```

The backend will run on `http://localhost:5000`

**Default Users (already created with TOTP):**
- Username: `admin`, Password: `fia123`, Team: `fia`
- Username: `admin`, Password: `ferrari123`, Team: `ferrari`
- Username: `admin`, Password: `mclaren123`, Team: `mclaren`
- Username: `admin`, Password: `redbull123`, Team: `redbull`

## Frontend Setup

### 1. Navigate to project root

```bash
cd ..
```

### 2. Install dependencies (if not already done)

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Using the System

### For Existing Users (Default Accounts)

1. **Get QR Code:**
   - Since default users are pre-created, you need to get their QR codes
   - Use the `/api/get-qr-code` endpoint or create a utility page
   - Example curl command:
   ```bash
   curl -X POST http://localhost:5000/api/get-qr-code \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","team":"fia"}'
   ```

2. **Scan QR Code:**
   - Open Google Authenticator app
   - Tap "+" to add account
   - Scan the QR code displayed
   - The app will show a 6-digit code that refreshes every 30 seconds

3. **Login:**
   - Go to `http://localhost:3000/login`
   - Enter: Username: `admin`, Password: `fia123`, Team: `FIA`
   - Click "INITIATE HANDSHAKE"
   - You'll be redirected to the MFA page
   - Enter the 6-digit code from Google Authenticator
   - The code will auto-verify when all 6 digits are entered
   - On success, you'll be redirected to the dashboard

### For New Users (Registration)

1. **Register:**
   - Go to `http://localhost:3000/register`
   - Fill in username, password, and select team
   - Click "CREATE ACCOUNT"

2. **QR Code Modal:**
   - A modal will appear with a QR code
   - The QR code has a white border for readability
   - Scan it with Google Authenticator
   - Click "I HAVE SCANNED IT - PROCEED TO LOGIN"

3. **Login:**
   - Follow the login steps above with your new credentials

## API Endpoints

### POST /api/register
Register a new user and receive QR code

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure123",
  "team": "ferrari"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "qr_code": "data:image/png;base64,..."
}
```

### POST /api/login
Authenticate with username/password

**Request:**
```json
{
  "username": "admin",
  "password": "fia123",
  "team": "fia"
}
```

**Response:**
```json
{
  "success": true,
  "mfa_required": true,
  "user_id": 1,
  "username": "admin",
  "team": "fia"
}
```

### POST /api/verify-2fa
Verify TOTP code

**Request:**
```json
{
  "user_id": 1,
  "username": "admin",
  "team": "fia",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "team": "fia"
  }
}
```

### POST /api/get-qr-code
Get QR code for existing user

**Request:**
```json
{
  "username": "admin",
  "team": "fia"
}
```

**Response:**
```json
{
  "success": true,
  "qr_code": "data:image/png;base64,..."
}
```

## UI Features

### Login Page
- Dark background with neon red accents
- Glass morphism card design
- Error handling with red error messages
- Link to registration page

### Registration Page
- Same dark aesthetic
- Password confirmation
- Team selection dropdown
- QR code modal on success

### QR Code Modal
- White border around QR code for contrast
- Step-by-step instructions
- Warning message about saving the code
- Prominent confirmation button

### MFA Page
- Auto-verification on 6-digit entry
- Red accent colors for security emphasis
- Back button to return to login
- User and team info display
- Real-time error feedback

## Security Notes

⚠️ **For Production:**
1. Change `SECRET_KEY` in `backend/app.py`
2. Implement proper password hashing (bcrypt/argon2)
3. Use HTTPS for all connections
4. Implement rate limiting on API endpoints
5. Add CSRF protection
6. Use proper session management
7. Store tokens securely (HttpOnly cookies)
8. Implement token refresh mechanism

## Troubleshooting

### Backend not connecting
- Ensure Flask is running on port 5000
- Check `.env.local` has correct API URL
- Verify CORS is enabled in Flask

### QR Code not scanning
- Ensure adequate lighting
- Make sure QR code is fully visible
- Try using manual entry option in authenticator app

### Invalid code error
- Codes expire every 30 seconds
- Check device time is synchronized
- Ensure correct user/team selected

### Database issues
- Delete `users.db` and restart Flask to reset
- Default users will be recreated automatically

## File Structure

```
f1-telemetry-dashboard/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt    # Python dependencies
│   ├── .gitignore
│   └── README.md
├── app/
│   ├── login/
│   │   └── page.tsx        # Login page with backend integration
│   ├── register/
│   │   └── page.tsx        # Registration page with QR modal
│   └── auth/
│       └── mfa/
│           └── page.tsx    # MFA verification page
├── .env.local              # Environment variables
└── 2FA_SETUP.md           # This file
```

## Testing the Flow

1. Start both backend and frontend servers
2. Open `http://localhost:3000`
3. Click "Register here"
4. Create a new account
5. Scan QR code with Google Authenticator
6. Confirm and proceed to login
7. Login with your credentials
8. Enter the 6-digit code from the app
9. Verify you're redirected to dashboard on success

## Support

For issues or questions, check:
- Backend logs in Flask console
- Frontend console in browser DevTools
- Network tab for API calls
- Ensure both servers are running
