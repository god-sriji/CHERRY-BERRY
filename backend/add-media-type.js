import mysql from 'mysql2/promise';

async function addMediaTypeColumn() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '235648',
      database: 'cherry_berry'
    });

    console.log('Connected to database...');
    
    await connection.execute(`
      ALTER TABLE POST 
      ADD COLUMN media_type ENUM('image', 'video') AFTER media_url
    `);
    
    console.log('✅ media_type column added successfully!');
    
    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists!');
    } else {
      console.error('Error:', error.message);
    }
  }
}

addMediaTypeColumn();
