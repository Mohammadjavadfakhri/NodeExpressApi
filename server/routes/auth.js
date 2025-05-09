const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required'});
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error registering user'});
                }
                res.status(201).json({ message: 'User registered' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error'});
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required'});
    }

db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
        return res.status(401).json({ error: 'Invalid Credential' });
    }

const user = results[0];
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch){
    return res.status(401).json({ error: 'Invalid credentials' });
}

const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
});
res.json({ token });
});
});

module.exports = router;