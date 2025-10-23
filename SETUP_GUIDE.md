# 🍒 Cherry Berry - Google OAuth Setup Guide

## Frontend & Backend with Google Authentication

### 📋 Prerequisites Completed
- ✅ Backend API with JWT authentication
- ✅ Frontend React app with Google OAuth
- ✅ MySQL database setup

---

## 🔑 Google OAuth Setup

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "Cherry Berry"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Cherry Berry Web Client"

5. **Configure OAuth Consent Screen** (if prompted)
   - User Type: "External"
   - App name: "Cherry Berry"
   - User support email: your email
   - Developer contact: your email
   - Save and continue

6. **Add Authorized JavaScript Origins**
   ```
   http://localhost:5173
   http://localhost:3002
   ```

7. **Add Authorized Redirect URIs**
   ```
   http://localhost:5173
   ```

8. **Copy Your Credentials**
   - You'll receive:
     - Client ID: `xxxxxx.apps.googleusercontent.com`
     - Client Secret: `xxxxxx`

---

## ⚙️ Configuration

### Backend (.env file)

Edit: `backend/.env`

Replace these values:
```env
# Update this line:
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET

# Make sure JWT secret is updated too:
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend (.env file)

Edit: `frontend/.env`

Replace this value:
```env
# Update this line:
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
```

---

## 🚀 Running the Application

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```
- Backend runs on: http://localhost:3002

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```
- Frontend runs on: http://localhost:5173

---

## 🧪 Testing the Flow

### 1. **Sign Up (New User)**
   - Open: http://localhost:5173
   - Click "Sign up"
   - Click "Sign up with Google"
   - Choose your Google account
   - ✅ Account created! Redirected to Dashboard

### 2. **Login (Existing User)**
   - Open: http://localhost:5173
   - Click "Sign in with Google"
   - Choose your Google account
   - ✅ Logged in! See your profile

### 3. **Dashboard**
   - View your profile information
   - See your Google profile picture
   - User ID, email, and join date displayed

---

## 🔐 What Happens Behind the Scenes

### Sign Up Flow:
1. User clicks "Sign up with Google"
2. Google OAuth popup appears
3. User selects Google account
4. Frontend receives Google JWT token
5. Frontend decodes token → gets user data
6. API call: `POST /api/users` (register)
7. Backend creates user in database
8. API call: `POST /api/users/verify` (login)
9. Backend returns JWT token
10. Frontend stores token → shows Dashboard

### Login Flow:
1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. User selects Google account
4. Frontend receives Google JWT token
5. Frontend decodes token → gets email
6. API call: `POST /api/users/verify`
7. Backend verifies user exists
8. Backend returns JWT token
9. Frontend stores token → shows Dashboard

---

## 📁 Project Structure

```
CHERRY BERRY/
├── backend/
│   ├── .env                    # ← Add Google credentials here
│   ├── server.js
│   └── src/
│       ├── config/
│       │   └── database.js
│       ├── models/
│       │   ├── User.js
│       │   └── index.js
│       ├── routes/
│       │   └── users.js        # API endpoints
│       ├── middleware/
│       │   └── index.js        # JWT verification
│       └── utils/
│           └── jwt.js          # JWT functions
│
└── frontend/
    ├── .env                     # ← Add Google Client ID here
    ├── src/
    │   ├── App.jsx              # Main app component
    │   ├── context/
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── services/
    │   │   └── api.js           # API calls
    │   └── components/
    │       ├── Login.jsx        # Login page
    │       ├── Signup.jsx       # Signup page
    │       └── Dashboard.jsx    # User dashboard
```

---

## 🐛 Troubleshooting

### Google Sign-in Button Not Showing
- ✅ Check `VITE_GOOGLE_CLIENT_ID` in frontend/.env
- ✅ Restart frontend dev server after .env changes

### "User not found" Error on Login
- ✅ Sign up first before trying to login
- ✅ Check backend is running on port 3002

### CORS Errors
- ✅ Backend .env has `FRONTEND_URL=http://localhost:5173`
- ✅ Restart backend after .env changes

### JWT Token Errors
- ✅ Check `JWT_SECRET` is set in backend/.env
- ✅ Clear localStorage in browser DevTools
- ✅ Try logging in again

---

## 🎉 You're All Set!

Your Cherry Berry app now has:
- ✅ Google OAuth authentication
- ✅ JWT token-based sessions
- ✅ Protected API routes
- ✅ User profile management
- ✅ Beautiful UI with gradients

**Next Steps:**
- Update Google OAuth credentials in .env files
- Start both servers
- Test sign up and login
- Build more features!

---

## 📞 Need Help?

Check these files for reference:
- API Documentation: `backend/API_DOCUMENTATION.md`
- Testing Guide: `backend/TESTING_GUIDE.md`
- Quick Start: `backend/QUICK_START.md`




npx cloudflared tunnel --url http://localhost:3002
add the url to frontend/.env
npm run dev // in backend