import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, createVaultManager } from './vault.js';
import { createAuthManager } from './auth.js';
import { hashPassword } from './cryptoUtils.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

if (db.data.users.length === 0) {
  const { hash, salt } = hashPassword('demo1234');
  db.saveUser({ id: 'usr_demo_001', username: 'demo_user', email: 'demo@securevault.local', name: 'Alex Rivera (Demo)', passwordHash: hash, passwordSalt: salt, createdAt: new Date().toISOString(), securityScore: 94 });
  db.logActivity('usr_demo_001', 'Demo account initialized', 'auth', 'SUCCESS', 'SecureVault initialized with AES-256-GCM engine.');
}

const auth = createAuthManager(db);
const vault = createVaultManager(db);

app.use(cors(), express.json(), express.urlencoded({ extended: true }));

// Auth & Dashboard Routes
app.post('/api/register', auth.register);
app.post('/api/login', auth.login);
app.get('/api/me', auth.requireAuth, auth.getMe);
app.get('/api/dashboard/stats', auth.requireAuth, vault.getStats);
app.get('/api/activity', auth.requireAuth, vault.getActivities);

// Vault & Sharing Routes
app.get('/api/files', auth.requireAuth, vault.getFiles);
app.post('/api/upload', auth.requireAuth, upload.single('file'), vault.uploadFile);
app.post('/api/download/:id', auth.requireAuth, vault.downloadFile);
app.post('/api/files/:id/download', auth.requireAuth, vault.downloadFile);
app.delete('/api/files/:id', auth.requireAuth, vault.deleteFile);
app.post('/api/files/:id/share', auth.requireAuth, vault.createShareLink);
app.get('/api/shares', auth.requireAuth, vault.getUserShares);
app.get('/api/files/:id/shares', auth.requireAuth, vault.getFileShares);
app.delete('/api/shares/:id', auth.requireAuth, vault.revokeShare);

// Public Share Access Routes
app.get('/api/public/share/:token', vault.getPublicShareInfo);
app.post('/api/public/share/:token/download', vault.downloadPublicSharedFile);
app.get('/api/health', (req, res) => res.json({ status: 'online', app: 'SecureVault Cryptographic Backend' }));

// Static & Fallback
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(frontendDist, 'index.html'), (err) => err && next()));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || 'Server error' }));

app.listen(PORT, () => console.log(`🛡️ SecureVault Backend on http://localhost:${PORT}`));

