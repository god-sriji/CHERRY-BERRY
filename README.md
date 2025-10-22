# 🍒 Cherry Berry

A modern social media platform with real-time chat functionality built with React and Node.js.

## Features

- 🔐 User Authentication (Email/Password & Google OAuth)
- 📝 Post Creation (Text, Images, Videos)
- 💬 Real-time Chat with WebSocket
- 👤 User Profiles
- 📱 Responsive Design
- ✅ Message Read Receipts (Sent/Seen indicators)

## Tech Stack

### Frontend
- React 19
- Vite
- Axios
- Socket.IO Client
- Google OAuth

### Backend
- Node.js
- Express
- MySQL
- Sequelize ORM
- Socket.IO
- JWT Authentication
- Multer (File uploads)

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL Database

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=3002
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=cherry_berry
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
```

4. Run database migrations:
```bash
node add-read-status.js
node update-message-schema.js
```

5. Start the server:
```bash
node server.js
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

4. Start the development server:
```bash
npm run dev
```

5. Access the app at `http://localhost:5173`

### Mobile Access

To access from mobile device on the same network:
```bash
npm run dev
# Access via http://YOUR_IP:5173
```

## Database Schema

### Main Tables
- USER - User accounts and profiles
- POST - User posts with media
- CHAT - Chat conversations
- MESSAGE - Chat messages with read status

## Project Structure

```
cherry-berry/
├── backend/
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   └── utils/         # JWT utilities
│   ├── uploads/           # User uploaded files
│   └── server.js          # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── context/       # Auth context
    │   ├── services/      # API & Socket services
    │   └── utils/         # Helper functions
    └── public/            # Static assets
```

## Features in Detail

### Authentication
- Email/Password registration and login
- Google OAuth integration
- JWT-based session management
- Protected routes

### Posts
- Create posts with text, images, or videos
- Support for multiple media types
- User profile integration

### Real-time Chat
- WebSocket-powered instant messaging
- Message read receipts (✓ sent, ✓✓ seen)
- Edit and delete messages
- Chat list with last message preview
- Auto-scroll to latest messages

### User Profiles
- Custom profile pictures
- Bio and username
- Onboarding flow for new users

## License

MIT

## Author

Your Name
