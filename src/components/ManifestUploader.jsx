import React, { useState } from "react";
import { uploadToIPFS } from "../utils/ipfs"; // helper kamu
import { saveManifestCIDToBlockchain } from "../utils/blockchain"; // helper kamu

const ManifestUploader = () => {
  const [patientId, setPatientId] = useState("");
  const [episodeId, setEpisodeId] = useState("");
  const [manifestFile, setManifestFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!patientId || !episodeId || !manifestFile) {
      alert("Please fill all fields.");
      return;
    }

    try {
      // Upload to IPFS
      const cid = await uploadToIPFS(manifestFile);

      // Simpan ke blockchain
      await saveManifestCIDToBlockchain(patientId, episodeId, cid);

      alert("Manifest uploaded and recorded on blockchain!");
      setManifestFile(null);
      setEpisodeId("");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <label className="block mb-1">Patient ID</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="e.g., RS202406781234"
        />
      </div>

      <div>
        <label className="block mb-1">Episode ID</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded"
          value={episodeId}
          onChange={(e) => setEpisodeId(e.target.value)}
          placeholder="e.g., EP001"
        />
      </div>

      <div>
        <label className="block mb-1">Manifest File (XML/JSON)</label>
        <input
          type="file"
          className="w-full px-3 py-2"
          onChange={(e) => setManifestFile(e.target.files[0])}
        />
      </div>

      <button type="submit" className="btn-submit">Upload Manifest</button>
    </form>
  );
};

export default ManifestUploader;
