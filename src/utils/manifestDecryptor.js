import { getFromIPFS } from "./ipfs";
import {
  getSessionKey,
  decryptTextFromBase64,
  decryptBase64ToBlob,
} from "./encrypt";

/**
 * Validasi format base64 string
 */
function isBase64String(str) {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(==)?|[A-Za-z0-9+/]{3}=)?$/;
  const isValid = typeof str === "string" && base64Regex.test(str.trim());
  console.log(`🔍 Base64 validation: ${isValid ? "valid" : "invalid"}`);
  return isValid;
}

/**
 * Mengambil dan mendekripsi file manifest dari IPFS
 */
export async function fetchAndDecryptManifest(cid, walletAddress, patientId) {
  try {
    console.log("🔍 Step 1: Fetching encrypted manifest from IPFS CID:", cid);
    const encryptedBase64 = await getFromIPFS(cid);
    console.log("📦 Encrypted manifest (first 100 chars):", encryptedBase64?.slice(0, 100));

    if (!isBase64String(encryptedBase64)) {
      throw new Error("Encrypted data is not valid base64.");
    }

    const key = getSessionKey();
    console.log("🔑 Session key retrieved:", key?.slice(0, 10), "(truncated)");
    if (!key || key.length < 10) {
      throw new Error("Session key not found or invalid. Please login or upload first.");
    }

    console.log("🔐 Step 2: Decrypting manifest...");
    const decodedText = decryptTextFromBase64(encryptedBase64, key);

    console.log("🧾 Decrypted text preview:", decodedText.slice(0, 100));
    if (!decodedText.trim().startsWith("<")) {
      console.warn("⚠️ Decrypted data does not start with '<', possibly malformed XML.");
      throw new Error("Decrypted content is not valid XML.");
    }

    console.log("✅ Manifest successfully decrypted and validated.");
    return decodedText;
  } catch (error) {
    console.error("❌ Error in fetchAndDecryptManifest:", error.message || error);
    throw error;
  }
}

/**
 * Mendekripsi file dari IPFS dan langsung mengunduh
 */
export async function decryptAndDownloadFile(cid, walletAddress, patientId, filename, mime = "application/octet-stream") {
  try {
    console.log("⬇️ Step 1: Fetching encrypted file from IPFS CID:", cid);
    const encryptedBase64 = await getFromIPFS(cid);
    console.log("📦 Encrypted file (first 100 chars):", encryptedBase64?.slice(0, 100));

    if (!isBase64String(encryptedBase64)) {
      throw new Error("Encrypted file from IPFS is not valid base64.");
    }

    const key = getSessionKey();
    console.log("🔑 Session key retrieved for file:", key?.slice(0, 10), "(truncated)");
    if (!key || key.length < 10) {
      throw new Error("Session key not found or invalid.");
    }

    console.log("🔐 Step 2: Decrypting file...");
    const blob = decryptBase64ToBlob(encryptedBase64, key, mime);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    console.log("✅ File decrypted and downloaded:", filename);
  } catch (error) {
    console.error("❌ Failed to decrypt & download file:", error.message || error);
    throw error;
  }
}
