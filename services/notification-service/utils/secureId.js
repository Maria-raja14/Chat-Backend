import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 12;
const key = crypto.createHash('sha256').update(process.env.ID_ENCRYPTION_KEY || 'VerySecure32ByteKeyForAES256!').digest();

function encryptId(id) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(id), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

function decryptId(encryptedId) {
  try {
    const data = Buffer.from(encryptedId, 'base64url');
    const iv = data.slice(0, ivLength);
    const tag = data.slice(ivLength, ivLength + 16);
    const ciphertext = data.slice(ivLength + 16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return Number(decrypted.toString('utf8'));
  } catch (err) {
    throw new Error('Invalid encrypted id format.');
  }
}

export { encryptId, decryptId };
