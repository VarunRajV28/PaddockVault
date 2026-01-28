# 🏎️ F1 Telemetry Dashboard with TOTP 2FA

A secure F1 telemetry management system with Google Authenticator-based Two-Factor Authentication.

## ✨ Features

- 🔐 **TOTP 2FA Authentication** - Google Authenticator integration
- 🎨 **Dark Mode UI** - Sleek black background with neon red accents
- 📱 **QR Code Setup** - Easy mobile authenticator configuration
- ⚡ **Auto-Verification** - Instant code validation on 6-digit entry
- 🔒 **Secure Sessions** - JWT-based authentication
- 🏁 **Team-Based Access** - FIA, Ferrari, McLaren, Red Bull support

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- Google Authenticator (or any TOTP app)

### Option 1: Windows Quick Start

1. **Start Backend:**
   ```bash
   start-backend.bat
   ```

2. **Start Frontend (in new terminal):**
   ```bash
   npm install
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Setup 2FA: http://localhost:3000/setup-2fa

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

#### Frontend Setup

```bash
# In project root
npm install
npm run dev
```

## 📖 How to Use

### First Time Setup (Existing Users)

Default users are already created with TOTP secrets. You need to scan their QR codes:

1. Visit: http://localhost:3000/setup-2fa
2. Select a user:
   - Username: `admin` | Password: `fia123` | Team: `FIA`
   - Username: `admin` | Password: `ferrari123` | Team: `Ferrari`
   - Username: `admin` | Password: `mclaren123` | Team: `McLaren`
   - Username: `admin` | Password: `redbull123` | Team: `Red Bull`
3. Click "GENERATE QR CODE"
4. Scan with Google Authenticator
5. Now you can login!

### Logging In

1. Go to http://localhost:3000/login
2. Enter credentials (e.g., `admin` / `fia123` / `FIA`)
3. Click "INITIATE HANDSHAKE"
4. You'll be redirected to MFA page
5. Enter 6-digit code from Google Authenticator
6. Code auto-verifies → redirects to dashboard

### Registering New User

1. Click "Register here" on login page
2. Fill in username, password, team
3. Click "CREATE ACCOUNT"
4. **QR Code Modal appears** ⚠️ SCAN THIS NOW!
5. Open Google Authenticator
6. Tap "+" → "Scan QR code"
7. Scan the displayed QR code
8. Click "I HAVE SCANNED IT"
9. Login with your new credentials

## 🎯 Project Structure

```
f1-telemetry-dashboard/
├── backend/
│   ├── app.py              # Flask API with TOTP
│   ├── requirements.txt    # Python dependencies
│   ├── users.db           # SQLite database (auto-created)
│   └── README.md
├── app/
│   ├── login/page.tsx      # Login with backend integration
│   ├── register/page.tsx   # Registration with QR modal
│   ├── setup-2fa/page.tsx  # Utility to get QR codes
│   ├── auth/mfa/page.tsx   # MFA verification
│   └── dashboard/          # Protected routes
├── components/
│   └── ui/                 # Shadcn UI components
├── .env.local              # API URL config
├── 2FA_SETUP.md           # Detailed setup guide
└── start-backend.bat       # Windows quick start
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register` | POST | Create new user + get QR code |
| `/api/login` | POST | Verify credentials → MFA required |
| `/api/verify-2fa` | POST | Validate TOTP code → get JWT |
| `/api/get-qr-code` | POST | Get QR for existing user |
| `/api/health` | GET | Health check |

## 🎨 UI Design

- **Color Scheme:** Black background, Neon Red (#EF4444) accents
- **Typography:** Monospace fonts for that terminal feel
- **Components:** Glass-morphism cards with backdrop blur
- **QR Code:** White border on white background for scanning
- **Animations:** Smooth transitions, loading spinners

## 🔒 Security Features

- ✅ TOTP-based 2FA (30-second window)
- ✅ JWT token authentication
- ✅ Session storage for MFA flow
- ✅ Auto-redirect on invalid auth
- ✅ Error handling with user feedback

⚠️ **Production Checklist:**
- [ ] Change Flask `SECRET_KEY`
- [ ] Implement password hashing (bcrypt)
- [ ] Use HTTPS
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Use secure cookie settings
- [ ] Add refresh token mechanism
- [ ] Use production database (PostgreSQL)

## 🐛 Troubleshooting

**"Failed to connect to server"**
- Ensure Flask backend is running on port 5000
- Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000`

**"Invalid verification code"**
- TOTP codes expire every 30 seconds
- Ensure device time is synchronized
- Check you scanned the correct team's QR code

**QR Code not scanning**
- Ensure good lighting
- Try zooming in/out
- Use manual entry option in authenticator

**Database errors**
- Delete `backend/users.db` and restart Flask
- Database will be recreated with default users

## 📱 Google Authenticator Setup

1. Install Google Authenticator:
   - [iOS App Store](https://apps.apple.com/app/google-authenticator/id388497605)
   - [Android Play Store](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)

2. Open app → Tap "+" → "Scan QR code"
3. Point at QR code displayed in app
4. Account added! Code refreshes every 30 seconds

## 🤝 Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Sonner (Toast notifications)

**Backend:**
- Python Flask
- SQLAlchemy (ORM)
- PyOTP (TOTP generation)
- QRCode (QR generation)
- PyJWT (Token handling)

## 📚 Additional Resources

- [2FA_SETUP.md](./2FA_SETUP.md) - Detailed setup instructions
- [backend/README.md](./backend/README.md) - Backend documentation
- [Google Authenticator Guide](https://support.google.com/accounts/answer/1066447)

## 📝 License

This project is for educational purposes. Modify as needed for production use.

---

**Ready to race? 🏁** Start both servers and visit http://localhost:3000
