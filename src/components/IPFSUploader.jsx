// Upload terenkripsi ke Pinata
// src/components/IPFSUploader.jsx
import React, { useState } from "react";
import { uploadToIPFS } from "../utils/ipfs";

const IPFSUploader = ({ onUploaded }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    try {
      const cid = await uploadToIPFS(file, file.name);
      setStatus(`Uploaded. CID: ${cid}`);
      if (onUploaded) onUploaded(cid);
    } catch (error) {
      console.error(error);
      setStatus("Upload failed.");
    }
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-semibold mb-2">Manual Upload to IPFS</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        className="bg-green-600 text-white px-3 py-1 rounded ml-2"
        onClick={handleUpload}
        disabled={!file}
      >
        Upload
      </button>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
};

export default IPFSUploader;
