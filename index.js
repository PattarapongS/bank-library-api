require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// JWT middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password)) {
            const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
            res.json({ accessToken });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/books', authenticateToken, async (req, res) => {
    const { title, author, isbn, published_year } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO books (title, author, isbn, published_year) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, author, isbn, published_year]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/books/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, published_year } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, isbn = $3, published_year = $4 WHERE id = $5 RETURNING *',
            [title, author, isbn, published_year, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/books/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/books', async (req, res) => {
    const { title, author } = req.query;
    let query = 'SELECT * FROM books';
    let params = [];
    if (title) {
        query += ' WHERE title ILIKE $1';
        params.push(`%${title}%`);
    } else if (author) {
        query += ' WHERE author ILIKE $1';
        params.push(`%${author}%`);
    }
    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});