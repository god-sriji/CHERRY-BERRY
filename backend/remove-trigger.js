import { sequelize } from './src/config/database.js';

const removeTrigger = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Drop the problematic trigger
    await sequelize.query(`DROP TRIGGER IF EXISTS auto_mark_messages_read;`);
    console.log('✓ Removed auto_mark_messages_read trigger');

    console.log('\n✅ Trigger removed successfully!');
    console.log('📝 Auto-marking will now be handled by application logic');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to remove trigger:', error);
    process.exit(1);
  }
};

removeTrigger();
