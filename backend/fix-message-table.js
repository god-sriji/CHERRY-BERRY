import mysql from 'mysql2/promise';

async function fixMessageTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '235648',
      database: 'cherry_berry'
    });

    console.log('Connected to database...');
    
    // Drop the MESSAGE table if it exists
    console.log('Dropping MESSAGE table...');
    await connection.execute('DROP TABLE IF EXISTS MESSAGE');
    
    // Create MESSAGE table with proper structure
    console.log('Creating MESSAGE table...');
    await connection.execute(`
      CREATE TABLE MESSAGE (
        message_id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES CHAT(chat_id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES USER(user_id) ON DELETE CASCADE,
        INDEX idx_chat (chat_id),
        INDEX idx_created (created_at)
      )
    `);
    
    console.log('✅ MESSAGE table created successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixMessageTable();
