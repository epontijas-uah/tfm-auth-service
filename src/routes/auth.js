const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SALT_ROUNDS = 10;

function getDb() {
  return require('../db');
}

router.post('/register', async (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username y PIN son obligatorios' });
  }

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'El PIN debe ser exactamente 4 dígitos numéricos' });
  }

  const db = getDb();
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
  }

  const pin_hash = await bcrypt.hash(pin, SALT_ROUNDS);
  db.prepare('INSERT INTO users (username, pin_hash) VALUES (?, ?)').run(username, pin_hash);

  res.status(201).json({ message: 'Usuario registrado correctamente' });
});

router.post('/login', async (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username y PIN son obligatorios' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const pinValido = await bcrypt.compare(pin, user.pin_hash);
  if (!pinValido) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username });
});

const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, (req, res) => {
  // Si llega aquí, es que el token es válido y está en req.user
  res.json({ 
    user: req.user,
    message: "Estás autenticado correctamente"
  });
});

module.exports = router;