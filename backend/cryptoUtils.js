import crypto from 'crypto';

export const deriveKey = (pass, salt) => crypto.pbkdf2Sync(pass, salt, 100000, 32, 'sha256');
export const computeSha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export function encryptBuffer(plainBuffer, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

  return {
    ciphertext,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    originalChecksum: computeSha256(plainBuffer)
  };
}

export function decryptBuffer(cipherBuffer, passphrase, saltHex, ivHex, authTagHex) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(passphrase, Buffer.from(saltHex, 'hex')), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  return { decrypted, checksum: computeSha256(decrypted) };
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { hash: crypto.scryptSync(password, salt, 64).toString('hex'), salt };
}

export function verifyPassword(password, salt, storedHash) {
  try {
    const key = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(key, Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

