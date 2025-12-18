// src/utils/encrypt.js
import CryptoJS from "crypto-js";

/* ==========================
 🔐 SESSION KEY MANAGEMENT
========================== */

// Derive deterministic 256-bit hex key from patientId + wallet
export const generateKey = (patientId, walletAddress) =>
  CryptoJS.SHA256(patientId + walletAddress).toString(CryptoJS.enc.Hex);

// Store session key (hex string) in sessionStorage
export const setSessionKey = (walletAddress, patientId) => {
  const key = generateKey(patientId, walletAddress);
  sessionStorage.setItem("sessionKey", key);
  return key;
};

// Retrieve session key
export const getSessionKey = () => sessionStorage.getItem("sessionKey");

/* ==========================
 📦 ENCRYPTION / DECRYPTION (TEXT – legacy, CryptoJS)
========================== */

// Encrypt UTF-8 text → Base64 (AES-CBC, legacy compatibility)
export function encryptTextToBase64(plainText, key = getSessionKey()) {
  if (!key) throw new Error("Session key not found");

  const aesKey = CryptoJS.enc.Hex.parse(key); // 256-bit key
  const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV

  const encrypted = CryptoJS.AES.encrypt(plainText, aesKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // IV || ciphertext → Base64
  const encryptedWithIv = iv.concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(encryptedWithIv);
}

// Decrypt Base64 → UTF-8 text (AES-CBC, legacy compatibility)
export function decryptTextFromBase64(base64Text, key = getSessionKey()) {
  try {
    if (!key) throw new Error("Session key not found");

    const aesKey = CryptoJS.enc.Hex.parse(key);
    const allData = CryptoJS.enc.Base64.parse(base64Text);

    const iv = CryptoJS.lib.WordArray.create(allData.words.slice(0, 4)); // 16 bytes
    const ciphertext = CryptoJS.lib.WordArray.create(allData.words.slice(4));

    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, aesKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return CryptoJS.enc.Utf8.stringify(decrypted);
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    throw new Error("Decryption failed (wrong key or corrupted data)");
  }
}

/* ==========================
 📂 FILE ENCRYPTION (CHUNKED – Web Crypto, recommended)
========================== */

// ---- helpers for big-endian uint32 ----
const uint32ToBytesBE = (n) =>
  new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);

const bytesToUint32BE = (buf, offset = 0) =>
  ((buf[offset] << 24) |
    (buf[offset + 1] << 16) |
    (buf[offset + 2] << 8) |
    buf[offset + 3]) >>> 0;

// Normalize key into 32 raw bytes
const normalizeKeyBytes = (keyHex) => {
  if (/^[0-9a-fA-F]{64,}$/.test(keyHex)) {
    return new Uint8Array(
      keyHex
        .slice(0, 64)
        .match(/.{1,2}/g)
        .map((b) => parseInt(b, 16))
    );
  }

  const enc = new TextEncoder().encode(keyHex || "");
  const out = new Uint8Array(32);
  out.set(enc.slice(0, 32));
  return out;
};

/**
 * Encrypt large file → encrypted Blob (AES-GCM per chunk)
 * Layout per chunk:
 *   [IV(12)] [CT_LEN(4)] [CIPHERTEXT]
 */
export async function encryptFileToEncryptedBlob(
  file,
  keyHex,
  onProgress = null,
  chunkSize = 4 * 1024 * 1024
) {
  if (!file) throw new Error("No file provided");

  const rawKeyBytes = normalizeKeyBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const reader = file.stream().getReader();
  const parts = [];
  let processed = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      value
    );

    const encryptedBytes = new Uint8Array(encrypted);
    const lenBytes = uint32ToBytesBE(encryptedBytes.length);

    parts.push(new Blob([iv, lenBytes, encryptedBytes]));

    processed += value.byteLength;
    if (onProgress) onProgress((processed / file.size) * 100);
  }

  return new Blob(parts, { type: "application/octet-stream" });
}

/**
 * Decrypt encrypted Blob → original Blob
 */
export async function decryptEncryptedBlobToBlob(
  encryptedBlob,
  keyHex,
  onProgress = null
) {
  const size = encryptedBlob.size;
  if (!size) return new Blob([]);

  const rawKeyBytes = normalizeKeyBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKeyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const parts = [];
  let offset = 0;

  while (offset < size) {
    const iv = new Uint8Array(await encryptedBlob.slice(offset, offset + 12).arrayBuffer());
    offset += 12;

    const lenArr = new Uint8Array(await encryptedBlob.slice(offset, offset + 4).arrayBuffer());
    const ctLen = bytesToUint32BE(lenArr);
    offset += 4;

    const ciphertext = await encryptedBlob.slice(offset, offset + ctLen).arrayBuffer();
    offset += ctLen;

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );

    parts.push(new Blob([new Uint8Array(decrypted)]));
    if (onProgress) onProgress((offset / size) * 100);
  }

  return new Blob(parts, { type: "application/octet-stream" });
}

/* ==========================
 📥 Backward compatibility (small files)
========================== */

export const SMALL_FILE_LIMIT = 5 * 1024 * 1024; // 5 MB

export async function encryptFileToBase64_CryptoJS(file, key = getSessionKey()) {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return encryptTextToBase64(CryptoJS.enc.Base64.stringify(wordArray), key);
}

/* ==========================
 🔧 MIME helper
========================== */

export const getMimeType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeMap = {
    xml: "application/xml",
    json: "application/json",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    txt: "text/plain",
    pdf: "application/pdf",
  };
  return mimeMap[ext] || "application/octet-stream";
};
