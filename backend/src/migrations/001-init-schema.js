import { sequelize } from '../config/database.js';

export const initializeSchema = async () => {
  try {
    // Create USER table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`USER\` (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(50) UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        username VARCHAR(100),
        bio TEXT,
        profile_pic VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(' USER table created');

    // Create POST table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`POST\` (
        post_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        media_url VARCHAR(255),
        media_type ENUM('image', 'video'),
        caption TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE
      )
    `);
    console.log(' POST table created');

    // Create CHAT table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`CHAT\` (
        chat_id INT AUTO_INCREMENT PRIMARY KEY,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_chat_pair UNIQUE (user1_id, user2_id),
        FOREIGN KEY (user1_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE
      )
    `);
    console.log(' CHAT table created');

    // Create MESSAGE table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`MESSAGE\` (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_text TEXT,
        message_type ENUM('text', 'image', 'video', 'audio') DEFAULT 'text',
        is_read BOOLEAN DEFAULT FALSE,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES \`CHAT\`(chat_id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE
      )
    `);
    console.log(' MESSAGE table created');

    // Create BLOCK table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`BLOCK\` (
        block_id INT AUTO_INCREMENT PRIMARY KEY,
        blocker_id INT NOT NULL,
        blocked_id INT NOT NULL,
        blocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blocker_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES \`USER\`(user_id) ON DELETE CASCADE
      )
    `);
    console.log(' BLOCK table created');

    // Create TRIGGER
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS prevent_blocked_message
      BEFORE INSERT ON \`MESSAGE\`
      FOR EACH ROW
      BEGIN
        DECLARE sender INT;
        DECLARE receiver INT;
        DECLARE blocked_count INT;

        SELECT user1_id, user2_id INTO sender, receiver
        FROM \`CHAT\`
        WHERE chat_id = NEW.chat_id;

        IF NEW.sender_id = receiver THEN
          SET receiver = sender;
          SET sender = NEW.sender_id;
        END IF;

        SELECT COUNT(*) INTO blocked_count
        FROM \`BLOCK\`
        WHERE (blocker_id = sender AND blocked_id = receiver)
           OR (blocker_id = receiver AND blocked_id = sender);

        IF blocked_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot send message: one of the users has blocked the other.';
        END IF;
      END
    `);
    console.log(' TRIGGER prevent_blocked_message created');

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  }
};
