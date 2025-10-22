import { sequelize } from './src/config/database.js';

const updateMessageSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Check if message_type column exists
    const [messageTypeCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'MESSAGE' 
        AND COLUMN_NAME = 'message_type';
    `);

    if (messageTypeCheck.length === 0) {
      // Add message_type column
      await sequelize.query(`
        ALTER TABLE MESSAGE 
        ADD COLUMN message_type ENUM('text', 'image', 'video', 'audio') DEFAULT 'text' NOT NULL;
      `);
      console.log('✓ Added message_type column');
    } else {
      console.log('✓ message_type column already exists');
    }

    // Check if sent_at column exists
    const [sentAtCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'MESSAGE' 
        AND COLUMN_NAME = 'sent_at';
    `);

    // Check if created_at column exists
    const [createdAtCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'MESSAGE' 
        AND COLUMN_NAME = 'created_at';
    `);

    if (sentAtCheck.length === 0 && createdAtCheck.length > 0) {
      // Rename created_at to sent_at
      await sequelize.query(`
        ALTER TABLE MESSAGE 
        CHANGE COLUMN created_at sent_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL;
      `);
      console.log('✓ Renamed created_at to sent_at');
    } else if (sentAtCheck.length > 0) {
      console.log('✓ sent_at column already exists');
    } else {
      // Add sent_at column if neither exists
      await sequelize.query(`
        ALTER TABLE MESSAGE 
        ADD COLUMN sent_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL;
      `);
      console.log('✓ Added sent_at column');
    }

    // Update message_text to allow NULL
    await sequelize.query(`
      ALTER TABLE MESSAGE 
      MODIFY COLUMN message_text TEXT NULL;
    `);
    console.log('✓ Updated message_text to allow NULL');

    // Recreate the trigger with sent_at
    await sequelize.query(`DROP TRIGGER IF EXISTS auto_mark_messages_read;`);

    await sequelize.query(`
      CREATE TRIGGER auto_mark_messages_read
      AFTER UPDATE ON MESSAGE
      FOR EACH ROW
      BEGIN
        IF NEW.is_read = 1 AND OLD.is_read = 0 THEN
          UPDATE MESSAGE
          SET is_read = 1
          WHERE chat_id = NEW.chat_id
            AND sender_id = NEW.sender_id
            AND sent_at <= NEW.sent_at
            AND is_read = 0
            AND message_id != NEW.message_id;
        END IF;
      END;
    `);
    console.log('✓ Updated trigger to use sent_at');

    console.log('\n✅ Schema update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
};

updateMessageSchema();
