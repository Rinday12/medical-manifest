 // Komponen enkripsi file
// src/components/Encryptor.jsx
import React, { useState } from "react";
import { encryptFile } from "../utils/encrypt";

const Encryptor = ({ onEncrypted }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleEncrypt = async () => {
    if (!file) return;
    setStatus("Encrypting...");
    try {
      const encrypted = await encryptFile(file);
      setStatus("Encryption successful.");
      if (onEncrypted) onEncrypted(encrypted);
    } catch (error) {
      console.error(error);
      setStatus("Encryption failed.");
    }
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-semibold mb-2">Manual Encrypt File</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
        onClick={handleEncrypt}
        disabled={!file}
      >
        Encrypt
      </button>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
};

export default Encryptor;
