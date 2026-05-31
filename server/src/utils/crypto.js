const crypto = require("crypto");
const logger = require("./logger");

const ALGORITHM = "aes-256-cbc";

/**
 * Derives a consistent 32-byte encryption key using SHA-256.
 * Fallbacks to JWT_SECRET or a development fallback key if ENCRYPTION_KEY is unset.
 */
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "fallback_dev_secrets_visualizer_key_32_bytes";
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts a plaintext string.
 * Returns the IV and ciphertext separated by a colon.
 * 
 * @param {string} text - Plaintext secret value
 * @returns {string} Encrypted string: "ivHex:encryptedHex"
 */
const encrypt = (text) => {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    logger.error(`Encryption failed: ${err.message}`);
    throw new Error("Failed to encrypt environment secret value.");
  }
};

/**
 * Decrypts an encrypted string in the format "ivHex:encryptedHex".
 * 
 * @param {string} encryptedText - Encrypted string from DB
 * @returns {string} Plaintext secret value
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format.");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    logger.error(`Decryption failed: ${err.message}`);
    return ""; // Return empty string rather than crashing in runtime
  }
};

module.exports = {
  encrypt,
  decrypt,
};
