const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );

            CREATE TABLE books (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                author VARCHAR(100) NOT NULL,
                isbn VARCHAR(20) UNIQUE NOT NULL,
                published_year INT
            );
        `);
        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        pool.end();
    }
};

createTables();