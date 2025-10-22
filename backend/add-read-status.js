import { sequelize } from './src/config/database.js';

const addReadStatusAndTrigger = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Check if column exists before adding
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'MESSAGE' 
        AND COLUMN_NAME = 'is_read';
    `);

    if (results.length === 0) {
      // Add is_read column
      await sequelize.query(`
        ALTER TABLE MESSAGE 
        ADD COLUMN is_read TINYINT(1) DEFAULT 0 NOT NULL;
      `);
      console.log('✓ Added is_read column');
    } else {
      console.log('✓ is_read column already exists');
    }

    // Create trigger to auto-mark older messages as read when the latest is read
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
    console.log('✓ Created trigger for auto-marking older messages as read');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addReadStatusAndTrigger();
