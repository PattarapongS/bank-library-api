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
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
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

// การ Register โดยส่ง Username Password
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    const hashedPassword = await bcrypt.hash(password, 10); // เข้ารหัสตัว Password
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', // บันทึกข้อมูลผู้ใช้ลงฐานข้อมูล
            [username, hashedPassword]
        );
        res.status(201).json(result.rows[0]); // ส่งข้อมูลผู้ใช้ที่ถูกสร้างกลับไป
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการบันทึกข้อมูล
    }
});

// การเข้าสู่ระบบโดยใช้ Username และ Password
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]); // ค้นหาผู้ใช้ในฐานข้อมูล
        if (result.rows.length === 0) return res.status(400).json({ error: 'ไม่พบผู้ใช้' }); // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่

        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password)) { // ตรวจสอบว่า Password ตรงกับที่เข้ารหัสไว้หรือไม่
            const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET); // สร้าง Token สำหรับยืนยันตัวตน
            res.json({ accessToken }); // ส่ง Token กลับไปให้ผู้ใช้
        } else {
            res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' }); // แจ้งเตือนเมื่อรหัสผ่านผิด
        }
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการค้นหาข้อมูล
        console.log(err);
    }
});

// การเพิ่มหนังสือใหม่ โดยต้องมี Token ยืนยันตัวตน
app.post('/books', authenticateToken, async (req, res) => {
    const { title, author, isbn, published_year } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO books (title, author, isbn, published_year) VALUES ($1, $2, $3, $4) RETURNING *', // เพิ่มข้อมูลหนังสือลงฐานข้อมูล
            [title, author, isbn, published_year]
        );
        res.status(201).json(result.rows[0]); // ส่งข้อมูลหนังสือที่ถูกสร้างกลับไป
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการบันทึกข้อมูล
    }
});

// การอัปเดตข้อมูลหนังสือ โดยต้องมี Token ยืนยันตัวตน
app.put('/books/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, published_year } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, isbn = $3, published_year = $4 WHERE id = $5 RETURNING *', // อัปเดตข้อมูลหนังสือตาม ID
            [title, author, isbn, published_year, id]
        );
        res.json(result.rows[0]); // ส่งข้อมูลหนังสือที่ถูกอัปเดตกลับไป
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการอัปเดตข้อมูล
    }
});

// การลบหนังสือ โดยต้องมี Token ยืนยันตัวตน
app.delete('/books/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [id]); // ลบหนังสือตาม ID
        res.status(204).send(); // ส่งสถานะ 204 (ไม่มีเนื้อหา) เพื่อบอกว่าลบสำเร็จ
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการลบข้อมูล
    }
});

// การค้นหาหนังสือ สามารถค้นหาจากชื่อหรือผู้แต่งได้
app.get('/books', async (req, res) => {
    const { title, author } = req.query;
    let query = 'SELECT * FROM books';
    let params = [];

    if (title) {
        query += ' WHERE title ILIKE $1'; // ค้นหาหนังสือจากชื่อ (ไม่สนใจตัวพิมพ์ใหญ่-เล็ก)
        params.push(`%${title}%`);
    } else if (author) {
        query += ' WHERE author ILIKE $1'; // ค้นหาหนังสือจากผู้แต่ง
        params.push(`%${author}%`);
    }

    try {
        const result = await pool.query(query, params); // ค้นหาข้อมูลหนังสือจากฐานข้อมูล
        res.json(result.rows); // ส่งรายการหนังสือที่ค้นพบกลับไป
    } catch (err) {
        res.status(500).json({ error: err.message }); // ส่งข้อความผิดพลาดหากเกิดข้อผิดพลาดในการค้นหาข้อมูล
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${port}`);
});
