# Block User Functionality - Setup Instructions

## ✅ Backend Implementation Complete

### Files Created/Modified:

1. **backend/src/models/Block.js** - Block model
2. **backend/src/routes/blocks.js** - Block API routes
3. **backend/src/models/index.js** - Added Block export
4. **backend/server.js** - Added blocks router
5. **backend/setup-block-trigger.sql** - SQL trigger setup file

## 🔧 Database Setup Required

### Step 1: Run the SQL Trigger Setup

You need to manually run the SQL commands in your MySQL database:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Then copy and paste the contents of setup-block-trigger.sql
# OR run it directly:
source backend/setup-block-trigger.sql
```

### What the SQL file does:

1. **Creates BLOCK table** with columns:
   - `block_id` (PRIMARY KEY)
   - `blocker_id` (user who blocks)
   - `blocked_id` (user who is blocked)
   - `blocked_at` (timestamp)

2. **Creates trigger** `prevent_blocked_user_message`:
   - Automatically prevents blocked users from sending messages
   - Triggers BEFORE INSERT on MESSAGE table
   - Checks if sender is blocked by any chat participant
   - Returns error: "Cannot send message: You are blocked by this user"

3. **Creates indexes** for better performance:
   - `idx_blocker` on `blocker_id`
   - `idx_blocked` on `blocked_id`
   - `unique_block` on `(blocker_id, blocked_id)` to prevent duplicate blocks

## 📡 API Endpoints

### Block a user
```
POST /api/blocks
Headers: Authorization: Bearer <token>
Body: { "blocked_id": 123 }
```

### Unblock a user
```
DELETE /api/blocks/:blocked_id
Headers: Authorization: Bearer <token>
```

### Get list of blocked users
```
GET /api/blocks
Headers: Authorization: Bearer <token>
```

### Check if a user is blocked
```
GET /api/blocks/check/:user_id
Headers: Authorization: Bearer <token>
```

## 🔒 How It Works

1. **User blocks someone**: 
   - Row inserted into BLOCK table
   
2. **Blocked user tries to send message**:
   - Trigger checks BLOCK table
   - If blocked, message is rejected with error
   - Frontend will receive 500 error with message

3. **User unblocks someone**:
   - Row deleted from BLOCK table
   - User can now send messages again

## ⚠️ Important Notes

- The trigger is created at the DATABASE level, not in Node.js
- You must run `setup-block-trigger.sql` manually in MySQL
- The trigger automatically handles message blocking
- No changes needed to message sending code
- Backend will receive MySQL error when blocked user tries to send message

## 🎯 Next Steps for Frontend

You'll need to:
1. Add block/unblock UI buttons in user profiles
2. Add API calls to block/unblock endpoints
3. Handle error when sending message to blocker
4. Show blocked users list in settings

