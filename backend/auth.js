import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword } from './cryptoUtils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'securevault_default_jwt_secret_dev_2026_key!';
const signToken = (u) => jwt.sign({ id: u.id, username: u.username, email: u.email }, JWT_SECRET, { expiresIn: '24h' });

export function createAuthManager(db) {
  const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(decoded.id);
      if (!user) return res.status(401).json({ error: 'Unauthorized: User not found' });
      req.user = { id: user.id, username: user.username, email: user.email, name: user.name };
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }
  };

  const register = (req, res) => {
    const { username, email, password, name } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
    }
    if (username.trim().length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be >= 3 chars and password >= 6 chars.' });
    }
    if (db.findUserByUsernameOrEmail(username.trim(), email.trim())) {
      return res.status(409).json({ error: 'Username or Email is already registered.' });
    }

    const { hash, salt } = hashPassword(password);
    const user = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      name: name?.trim() || username.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      securityScore: 85
    };

    db.saveUser(user);
    db.logActivity(user.id, 'User account registered', 'auth', 'SUCCESS', `User @${user.username} registered.`);
    res.status(201).json({ message: 'Registration successful', token: signToken(user), user: { id: user.id, username: user.username, email: user.email, name: user.name } });
  };

  const login = (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier?.trim() || !password) return res.status(400).json({ error: 'Credentials required.' });

    const user = db.findUserByUsernameOrEmail(identifier.trim(), identifier.trim());
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      if (user) db.logActivity(user.id, 'Failed login attempt', 'auth', 'WARNING', `Failed login for @${user.username}`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    db.logActivity(user.id, 'User logged in', 'auth', 'SUCCESS', `User @${user.username} authenticated.`);
    res.json({ message: 'Login successful', token: signToken(user), user: { id: user.id, username: user.username, email: user.email, name: user.name } });
  };

  const getMe = (req, res) => {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, username: user.username, email: user.email, name: user.name, createdAt: user.createdAt } });
  };

  return { requireAuth, register, login, getMe };
}

