// src/components/ManifestUploader.jsx

import React, { useEffect, useState } from "react";
import { deriveKey, encryptFile } from "../utils/encryption";
import { uploadToIPFS } from "../utils/ipfs";

const ManifestUploader = ({ manifestContent, walletAddress, patientId }) => {
  const [cid, setCid] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !patientId) {
      console.warn("⚠️ walletAddress atau patientId belum tersedia");
    }
  }, [walletAddress, patientId]);

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      setCid(null);

      if (!walletAddress || !patientId) {
        throw new Error("Wallet address dan Patient ID wajib diisi");
      }

      if (!manifestContent || typeof manifestContent !== "string") {
        throw new Error("Manifest content kosong atau tidak valid");
      }

      console.log("🔐 Deriving AES key...");
      const key = await deriveKey(walletAddress, patientId);

      console.log("📄 Converting manifest to Blob...");
      const manifestBlob = new Blob(
        [new TextEncoder().encode(manifestContent)],
        { type: "application/xml" }
      );

      console.log("🔒 Encrypting manifest...");
      const { iv, data } = await encryptFile(manifestBlob, key);

      // Gabungkan IV + ciphertext (FORMAT WAJIB)
      const encryptedBlob = new Blob(
        [iv, data],
        { type: "application/octet-stream" }
      );

      console.log("⬆️ Uploading encrypted manifest to IPFS...");
      const cid = await uploadToIPFS(
        encryptedBlob,
        `manifest-${patientId}-${Date.now()}.bin`
      );

      if (!cid) throw new Error("Upload ke IPFS gagal");

      console.log("✅ Manifest uploaded. CID:", cid);
      setCid(cid);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-gray-300 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">📤 Upload Manifest</h2>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
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
