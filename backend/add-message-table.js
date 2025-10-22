import mysql from 'mysql2/promise';

async function addCreatedAtColumn() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '235648',
      database: 'cherry_berry'
    });

    console.log('Connected to database...');
    
    // Check if MESSAGE table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'MESSAGE'"
    );

    if (tables.length === 0) {
      console.log('MESSAGE table does not exist. Creating it...');
      await connection.execute(`
        CREATE TABLE MESSAGE (
          message_id INT PRIMARY KEY AUTO_INCREMENT,
          chat_id INT NOT NULL,
          sender_id INT NOT NULL,
          message_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_id) REFERENCES CHAT(chat_id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES USER(user_id) ON DELETE CASCADE
        )
      `);
      console.log('✅ MESSAGE table created successfully!');
    } else {
      console.log('MESSAGE table exists. Adding created_at column...');
      await connection.execute(`
        ALTER TABLE MESSAGE 
        ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ created_at column added successfully!');
    }
    
    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column already exists!');
    } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✅ Table already exists!');
    } else {
      console.error('Error:', error.message);
    }
  }
}

addCreatedAtColumn();
