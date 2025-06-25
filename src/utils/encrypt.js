// Enkripsi file (AES/ChaCha20, dll)
//utils/encrypt.js
import CryptoJS from "crypto-js";


/**
 * Encrypt buffer (ArrayBuffer) menggunakan AES
 * @param {ArrayBuffer} buffer - Data asli
 * @param {string} key - Kunci enkripsi
 * @returns {string} - Encrypted Base64 string
 */
export function encryptBuffer(buffer, key = "default-secret-key") {
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
  return encrypted;
}

/**
 * Dekripsi string terenkripsi menjadi kembali ke ArrayBuffer
 * @param {string} encryptedText - Teks terenkripsi
 * @param {string} key - Kunci rahasia yang sama dengan saat enkripsi
 * @returns {ArrayBuffer} - Buffer hasil dekripsi
 */
export function decryptToBuffer(encryptedText, key) {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  const wordArray = decrypted;
  const uint8Array = new Uint8Array(wordArray.sigBytes);
  for (let i = 0; i < wordArray.sigBytes; i++) {
    uint8Array[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return uint8Array.buffer;
}

/**
 * Utility: Konversi File ke ArrayBuffer
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function fileToBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Utility: Konversi string Base64 ke file
 * @param {string} base64Str
 * @param {string} filename
 * @param {string} mimeType
 * @returns {File}
 */
export function base64ToFile(base64Str, filename, mimeType) {
  const byteString = atob(base64Str);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], filename, { type: mimeType });
}

export const encryptFile = async (file, key = "default-secret-key") => {
  const buffer = await fileToBuffer(file);
  const encrypted = encryptBuffer(buffer, key);
  return new Blob([encrypted], { type: "text/plain" });
};
/**
 * Utility: Enkripsi string (misal XML manifest)
 * @param {string} text - Teks biasa
 * @param {string} key - Kunci enkripsi
 * @returns {Blob} - Blob terenkripsi
 */
export function encryptText(text, key = "default-secret-key") {
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return new Blob([encrypted], { type: "text/plain" });
  }
  