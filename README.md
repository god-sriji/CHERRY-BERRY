# 🍒 Cherry Berry

<p align="center">
  A modern full-stack social media platform with real-time messaging, media sharing, and responsive UI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/MySQL-Database-orange?style=for-the-badge&logo=mysql" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge&logo=socket.io" />
</p>

---

# 📸 Preview

## Feed & Social Experience

![Feed](https://github.com/user-attachments/assets/6fcc2a53-f9ff-43f1-9a28-2cff0f7b613f)

---

## Real-Time Chat

![Chat](https://github.com/user-attachments/assets/6218b473-5b1f-482e-8f76-88765089b834)

---

## Profile & User System

![Profile](https://github.com/user-attachments/assets/0b6f59a1-0faa-4b7e-bd6a-934cc41e1d6d)

---

## Responsive Mobile Experience

![Mobile](https://github.com/user-attachments/assets/be006cf1-75a4-4bb1-aaf1-c8c97d881514)

---

# ✨ Features

- 🔐 Authentication System
  - Email/Password login
  - Google OAuth
  - JWT authentication

- 📝 Social Posting
  - Text posts
  - Image uploads
  - Video uploads

- 💬 Real-Time Messaging
  - Socket.IO powered chat
  - Read receipts
  - Message editing/deleting
  - Live updates

- 👤 User Profiles
  - Profile pictures
  - Bio system
  - User onboarding

- 📱 Fully Responsive
  - Desktop UI
  - Mobile optimized
  - Smooth layouts

---

# 🛠 Tech Stack

## Frontend
- React 19
- Vite
- Axios
- Socket.IO Client
- Google OAuth

## Backend
- Node.js
- Express
- MySQL
- Sequelize ORM
- Socket.IO
- JWT Authentication
- Multer

---

# ⚙️ Setup Instructions

## Prerequisites

- Node.js v16+
- MySQL

---

# Backend Setup

### 1. Navigate to backend

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

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

### 4. Run migrations

```bash
node add-read-status.js
node update-message-schema.js
```

### 5. Start backend server

```bash
node server.js
```

---

# Frontend Setup

### 1. Navigate to frontend

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Start development server

```bash
npm run dev
```

---

# 📱 Mobile Access

Run:

```bash
npm run dev
```

Then access:

```bash
http://YOUR_IP:5173
```

from devices on the same network.

---

# 🗄 Database Schema

## Main Tables

| Table | Description |
|---|---|
| USER | User accounts & profiles |
| POST | Posts and media |
| CHAT | Chat conversations |
| MESSAGE | Messages with read status |

---

# 📂 Project Structure

```bash
cherry-berry/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── uploads/
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── services/
    │   └── utils/
    └── public/
```

---

# 🚀 Future Improvements

- Notifications system
- Stories feature
- Video calling
- Dark mode
- Post likes/comments
- PWA support

---

## 📄 License

This project is licensed under the MIT License.MIT

---

# 👨‍💻 Authors

Made by:

- [@srijii](https://github.com/srijii)
- [@LamiyaRasheed](https://github.com/LamiyaRasheed)
