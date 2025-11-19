import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-this';

export function encryptApiKey(apiKey: string): string {
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
