// src/utils/ipfs.js
import axios from "axios";

/**
 * ============================
 * 🔐 Pinata ENV (Vite only)
 * ============================
 * NOTE:
 * - Pastikan menggunakan prefix VITE_
 * - Wajib restart `npm run dev` setelah ubah .env
 */
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;


if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  console.error("❌ Missing Pinata ENV:", {
    PINATA_API_KEY,
    PINATA_SECRET_API_KEY,
  });
  throw new Error("Pinata API key missing. Check .env configuration");
}

/**
 * ============================
 * 📤 Upload File to IPFS (Pinata)
 * ============================
 */
export const uploadToIPFS = async (fileBlob, filename = "file") => {
  if (!fileBlob) throw new Error("No file provided for IPFS upload");

  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", fileBlob, filename);

  try {
    const res = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
        // ❗ Jangan set Content-Type manual (axios otomatis)
      },
    });

    if (!res?.data?.IpfsHash) {
      throw new Error("Invalid Pinata response");
    }

    return res.data.IpfsHash; // CID
  } catch (error) {
    console.error(
      "❌ Pinata upload failed:",
      error.response?.data || error.message
    );
    throw new Error("Upload to IPFS failed");
  }
};

/**
 * ============================
 * 📥 Download Base64 Text (Encrypted / XML)
 * ============================
 */
export const getFromIPFS = async (cid) => {
  if (!cid) throw new Error("CID is required");

  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const base64 = await blobToBase64(blob);

    // Remove prefix: data:*/*;base64,
    const base64Clean = base64.split(",")[1];
    if (!base64Clean || base64Clean.length < 20) {
      throw new Error("Base64 content invalid or too short");
    }

    return base64Clean;
  } catch (err) {
    console.error("❌ IPFS download/decode failed:", err);
    throw err;
  }
};

/**
 * Helper: Blob → Base64
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * ============================
 * 📦 Download File as Blob (binary / images)
 * ============================
 */
export const getFileBlobFromIPFS = async (cid) => {
  if (!cid) throw new Error("CID is required");

  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`IPFS blob fetch failed: ${res.status} ${res.statusText}`);
    }

    return await res.blob();
  } catch (error) {
    console.error("❌ Fetch blob from IPFS failed:", error.message);
    throw error;
  }
};