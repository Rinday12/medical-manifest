// src/components/ManifestUploader.jsx

import React, { useEffect, useState } from "react";
import { encryptText, getSessionKey, setSessionKey } from "../utils/encrypt";
import { uploadToIPFS } from "../utils/ipfs";

const ManifestUploader = ({ manifestContent, walletAddress, patientId }) => {
  const [cid, setCid] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (walletAddress && patientId) {
      console.log("🔐 Setting session key using wallet & patientId...");
      setSessionKey(walletAddress, patientId);
    }
  }, [walletAddress, patientId]);

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      console.log("📦 Starting manifest upload...");

      // 1. Get session key
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        throw new Error("Session key not found. Please login or re-authenticate.");
      }
      console.log("🔑 Session key found:", sessionKey.toString());

      // 2. Debug manifest content
      if (!manifestContent) {
        throw new Error("Manifest content is empty or undefined.");
      }
      console.log("📄 Manifest content:", manifestContent);

      // 3. Encrypt
      console.log("🔐 Encrypting manifest...");
      const encryptedText = encryptText(manifestContent, sessionKey);

      if (!encryptedText || typeof encryptedText !== "string") {
        throw new Error("Encryption failed. Encrypted result is invalid.");
      }
      console.log("🔐 Encrypted text length:", encryptedText.length);

      // 4. Upload to IPFS
      console.log("⬆️ Uploading to IPFS...");
      const ipfsCid = await uploadToIPFS(encryptedText);

      if (!ipfsCid || typeof ipfsCid !== "string") {
        throw new Error("IPFS upload failed. No CID returned.");
      }

      console.log("✅ Upload complete. CID:", ipfsCid);
      setCid(ipfsCid);
    } catch (err) {
      console.error("❌ Upload error:", err.message);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-gray-300 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">📤 Upload Manifest</h2>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Manifest"}
      </button>

      {error && <p className="text-red-500 mt-2">❌ {error}</p>}

      {cid && (
        <p className="text-green-600 mt-2">
          ✅ Upload success. CID: <code>{cid}</code>
        </p>
      )}
    </div>
  );
};

export default ManifestUploader;
