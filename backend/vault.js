import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { encryptBuffer, decryptBuffer, hashPassword, verifyPassword } from './cryptoUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const STORAGE_DIR = path.join(__dirname, 'vault_storage');
const DB_FILE = path.join(DATA_DIR, 'vault_db.json');

[DATA_DIR, STORAGE_DIR].forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

class VaultDatabase {
  constructor() {
    this.data = { users: [], files: [], activities: [], shares: [] };
    this.load();
  }
  load() {
    try {
      if (fs.existsSync(DB_FILE)) this.data = { ...this.data, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) };
    } catch {
      this.save();
    }
  }
  save() {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8'); } catch (e) { console.error('DB save error:', e); }
  }
  findUserById = (id) => this.data.users.find(u => u.id === id);
  findUserByUsernameOrEmail = (u, e) => this.data.users.find(x => x.username.toLowerCase() === u.toLowerCase() || x.email.toLowerCase() === e.toLowerCase());
  saveUser = (user) => {
    const i = this.data.users.findIndex(u => u.id === user.id);
    i >= 0 ? (this.data.users[i] = user) : this.data.users.push(user);
    this.save();
  };
  getUserFiles = (uid) => this.data.files.filter(f => f.userId === uid);
  getFileById = (id) => this.data.files.find(f => f.id === id);
  saveFileRecord = (f) => { this.data.files.push(f); this.save(); };
  deleteFileRecord = (id) => {
    this.data.files = this.data.files.filter(f => f.id !== id);
    this.data.shares = (this.data.shares || []).filter(s => s.fileId !== id);
    this.save();
  };
  saveShareRecord = (s) => { (this.data.shares ||= []).push(s); this.save(); };
  getShareByToken = (tok) => (this.data.shares || []).find(s => s.token === tok);
  getShareById = (id) => (this.data.shares || []).find(s => s.id === id);
  getUserShares = (uid) => (this.data.shares || []).filter(s => s.userId === uid);
  getFileShares = (fid) => (this.data.shares || []).filter(s => s.fileId === fid);
  updateShare = (share) => {
    const i = (this.data.shares || []).findIndex(s => s.id === share.id);
    if (i >= 0) { this.data.shares[i] = share; this.save(); }
  };
  logActivity = (userId, action, category = 'vault', status = 'SUCCESS', details = '') => {
    const act = { id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), userId, action, category, status, details, timestamp: new Date().toISOString() };
    this.data.activities.unshift(act);
    if (this.data.activities.length > 200) this.data.activities = this.data.activities.slice(0, 200);
    this.save();
    return act;
  };
  getUserActivities = (uid, lim = 50) => this.data.activities.filter(a => a.userId === uid).slice(0, lim);
}

export const db = new VaultDatabase();

export function createVaultManager(database) {
  const sanitize = (n) => path.basename(n).replace(/[^a-zA-Z0-9._-]/g, '_');
  const getFileDTO = (f) => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, encryptedSize: f.encryptedSize, algorithm: f.algorithm, originalChecksum: f.originalChecksum, hasCustomPassword: f.hasCustomPassword, passwordHint: f.passwordHint, createdAt: f.createdAt });
  const getShareDTO = (s) => ({ id: s.id, token: s.token, fileId: s.fileId, fileName: s.fileName, mimeType: s.mimeType, size: s.size, createdAt: s.createdAt, expiresAt: s.expiresAt, downloadLimit: s.downloadLimit, downloadsCount: s.downloadsCount, hasLinkPassword: s.hasLinkPassword, hasCustomPassword: s.hasCustomPassword, passwordHint: s.passwordHint, isRevoked: s.isRevoked, isExpired: s.expiresAt ? new Date() > new Date(s.expiresAt) : false, isLimitReached: s.downloadLimit ? s.downloadsCount >= s.downloadLimit : false });

  const uploadFile = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const { customPassword, passwordHint } = req.body;
    const user = database.findUserById(req.user.id);
    const pass = customPassword?.trim() || `SV_VAULT_KEY_${user.passwordSalt}_${user.id}`;
    const name = sanitize(req.file.originalname || 'document.bin');

    try {
      const { ciphertext, salt, iv, authTag, originalChecksum } = encryptBuffer(req.file.buffer, pass);
      const storageId = `enc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.vault`;
      fs.writeFileSync(path.join(STORAGE_DIR, storageId), ciphertext);

      const record = { id: 'fl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8), userId: req.user.id, name, mimeType: req.file.mimetype || 'application/octet-stream', size: req.file.buffer.length, encryptedSize: ciphertext.length, storageId, algorithm: 'AES-256-GCM', salt, iv, authTag, originalChecksum, hasCustomPassword: Boolean(customPassword?.trim()), passwordHint: passwordHint?.trim() || null, createdAt: new Date().toISOString() };
      database.saveFileRecord(record);
      database.logActivity(req.user.id, 'File uploaded & protected', 'vault', 'SUCCESS', `«${name}» encrypted with AES-256-GCM (${(req.file.buffer.length / 1024).toFixed(1)} KB)`);

      res.status(201).json({ message: 'File encrypted and stored.', file: getFileDTO(record) });
    } catch {
      res.status(500).json({ error: 'Encryption failed.' });
    }
  };

  const getFiles = (req, res) => res.json({ files: database.getUserFiles(req.user.id).map(getFileDTO) });

  const downloadFile = (req, res) => {
    const file = database.getFileById(req.params.id);
    if (!file || file.userId !== req.user.id) return res.status(404).json({ error: 'File not found.' });

    const storagePath = path.join(STORAGE_DIR, file.storageId);
    if (!fs.existsSync(storagePath)) return res.status(404).json({ error: 'Storage file missing.' });

    const user = database.findUserById(req.user.id);
    const pass = file.hasCustomPassword ? req.body.password?.trim() : (req.body.password?.trim() || `SV_VAULT_KEY_${user.passwordSalt}_${user.id}`);
    if (file.hasCustomPassword && !pass) return res.status(400).json({ error: 'Password required.', requiresPassword: true, passwordHint: file.passwordHint });

    try {
      const { decrypted, checksum } = decryptBuffer(fs.readFileSync(storagePath), pass, file.salt, file.iv, file.authTag);
      if (checksum !== file.originalChecksum) throw new Error('Checksum mismatch');

      database.logActivity(req.user.id, 'File downloaded & decrypted', 'vault', 'SUCCESS', `«${file.name}» decrypted and verified.`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.send(decrypted);
    } catch {
      database.logActivity(req.user.id, 'Failed decryption attempt', 'security', 'WARNING', `Decryption failed for «${file.name}»`);
      res.status(403).json({ error: 'Decryption failed: Incorrect password or corrupted payload.' });
    }
  };

  const deleteFile = (req, res) => {
    const file = database.getFileById(req.params.id);
    if (!file || file.userId !== req.user.id) return res.status(404).json({ error: 'File not found.' });

    const storagePath = path.join(STORAGE_DIR, file.storageId);
    if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
    database.deleteFileRecord(req.params.id);
    database.logActivity(req.user.id, 'File securely deleted', 'vault', 'SUCCESS', `«${file.name}» removed.`);
    res.json({ message: `«${file.name}» removed from vault.` });
  };

  const getActivities = (req, res) => res.json({ activities: database.getUserActivities(req.user.id, 50) });

  const getStats = (req, res) => {
    const files = database.getUserFiles(req.user.id);
    const acts = database.getUserActivities(req.user.id, 6);
    let score = Math.min(99, Math.max(50, 80 + (files.length > 0 ? 5 : 0) + (files.length >= 3 ? 5 : 0) + (files.some(f => f.hasCustomPassword) ? 4 : 0) - Math.min(15, acts.filter(a => a.status === 'WARNING').length * 5)));
    res.json({
      securityScore: score,
      securityStatus: score < 70 ? 'Needs Attention' : score < 85 ? 'Good' : 'Excellent',
      totalFiles: files.length,
      totalBytes: files.reduce((a, f) => a + (f.size || 0), 0),
      totalEncryptedBytes: files.reduce((a, f) => a + (f.encryptedSize || 0), 0),
      encryptionAlgorithm: 'AES-256-GCM (Authenticated)',
      keyDerivation: 'PBKDF2 (100,000 rounds, SHA-256)',
      recentActivities: acts
    });
  };

  const createShareLink = (req, res) => {
    const file = database.getFileById(req.params.id);
    if (!file || file.userId !== req.user.id) return res.status(404).json({ error: 'File not found.' });

    const user = database.findUserById(req.user.id);
    const { expiresInHours, downloadLimit, linkPassword } = req.body;
    const passData = linkPassword?.trim() ? hashPassword(linkPassword.trim()) : null;

    const share = {
      id: 'sh_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      token: 'st_' + crypto.randomBytes(16).toString('hex'),
      fileId: file.id,
      userId: req.user.id,
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: new Date().toISOString(),
      expiresAt: expiresInHours > 0 ? new Date(Date.now() + expiresInHours * 3600000).toISOString() : null,
      downloadLimit: parseInt(downloadLimit, 10) || null,
      downloadsCount: 0,
      hasLinkPassword: Boolean(passData),
      linkPasswordHash: passData?.hash || null,
      linkPasswordSalt: passData?.salt || null,
      hasCustomPassword: file.hasCustomPassword,
      passwordHint: file.passwordHint,
      internalPassphrase: file.hasCustomPassword ? null : `SV_VAULT_KEY_${user.passwordSalt}_${user.id}`,
      isRevoked: false
    };

    database.saveShareRecord(share);
    database.logActivity(req.user.id, 'Share link generated', 'vault', 'SUCCESS', `Share link for «${file.name}» generated.`);
    res.status(201).json({ message: 'Share link created.', share: getShareDTO(share) });
  };

  const getPublicShareInfo = (req, res) => {
    const share = database.getShareByToken(req.params.token);
    if (!share || share.isRevoked) return res.status(404).json({ error: 'Link invalid or revoked.' });
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) return res.status(410).json({ error: 'Link expired.' });
    if (share.downloadLimit && share.downloadsCount >= share.downloadLimit) return res.status(410).json({ error: 'Download limit reached.' });

    const file = database.getFileById(share.fileId);
    if (!file) return res.status(404).json({ error: 'File removed.' });

    res.json({
      token: share.token, fileName: file.name, mimeType: file.mimeType, size: file.size, encryptedSize: file.encryptedSize,
      algorithm: file.algorithm, originalChecksum: file.originalChecksum, createdAt: share.createdAt, expiresAt: share.expiresAt,
      downloadLimit: share.downloadLimit, downloadsCount: share.downloadsCount, requiresLinkPassword: share.hasLinkPassword,
      requiresFilePassword: share.hasCustomPassword, passwordHint: share.passwordHint
    });
  };

  const downloadPublicSharedFile = (req, res) => {
    const share = database.getShareByToken(req.params.token);
    if (!share || share.isRevoked) return res.status(404).json({ error: 'Link invalid or revoked.' });
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) return res.status(410).json({ error: 'Link expired.' });
    if (share.downloadLimit && share.downloadsCount >= share.downloadLimit) return res.status(410).json({ error: 'Limit reached.' });

    const { password, linkPassword, filePassword } = req.body || {};
    if (share.hasLinkPassword && !verifyPassword((linkPassword || password || '').trim(), share.linkPasswordSalt, share.linkPasswordHash)) {
      return res.status(403).json({ error: 'Incorrect link password.' });
    }

    const file = database.getFileById(share.fileId);
    if (!file || !fs.existsSync(path.join(STORAGE_DIR, file.storageId))) return res.status(404).json({ error: 'File unavailable.' });

    const pass = share.hasCustomPassword ? (filePassword || password)?.trim() : share.internalPassphrase;
    if (share.hasCustomPassword && !pass) return res.status(400).json({ error: 'File password required.', requiresPassword: true, passwordHint: file.passwordHint });

    try {
      const { decrypted, checksum } = decryptBuffer(fs.readFileSync(path.join(STORAGE_DIR, file.storageId)), pass, file.salt, file.iv, file.authTag);
      if (checksum !== file.originalChecksum) return res.status(400).json({ error: 'Integrity mismatch.' });

      share.downloadsCount++;
      if (share.downloadLimit && share.downloadsCount >= share.downloadLimit) share.isRevoked = true;
      database.updateShare(share);
      database.logActivity(share.userId, 'Shared file downloaded', 'vault', 'SUCCESS', `«${file.name}» downloaded.`);

      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.send(decrypted);
    } catch {
      res.status(403).json({ error: 'Decryption failed: Incorrect password.' });
    }
  };

  const getUserShares = (req, res) => res.json({ shares: database.getUserShares(req.user.id).map(getShareDTO) });
  const getFileShares = (req, res) => res.json({ shares: database.getFileShares(req.params.id).filter(s => s.userId === req.user.id).map(getShareDTO) });
  const revokeShare = (req, res) => {
    const share = database.getShareById(req.params.id);
    if (!share || share.userId !== req.user.id) return res.status(404).json({ error: 'Share not found.' });
    share.isRevoked = true;
    database.updateShare(share);
    database.logActivity(req.user.id, 'Share link revoked', 'vault', 'SUCCESS', `Share revoked for «${share.fileName}».`);
    res.json({ message: 'Share revoked.' });
  };

  return { uploadFile, getFiles, downloadFile, deleteFile, getActivities, getStats, createShareLink, getPublicShareInfo, downloadPublicSharedFile, getUserShares, getFileShares, revokeShare };
}
