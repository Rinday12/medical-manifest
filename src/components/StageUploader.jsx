import React, { useState } from "react";
import { encryptFile } from "../utils/encrypt";
import { uploadToIPFS } from "../utils/ipfs";
import { addFileToManifest } from "../utils/manifest";

// Komponen untuk mengunggah file berdasarkan tahapan perawatan pasien
const StageUploader = ({ stage, manifestXml, setManifestXml }) => {
  const [file, setFile] = useState(null); // File yang akan diunggah
  const [type, setType] = useState("lab_result"); // Jenis data medis
  const [uploading, setUploading] = useState(false); // Status proses upload
  const [message, setMessage] = useState(""); // Status pesan untuk user

  // Handler saat memilih file
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  // Generate nama file unik berdasarkan waktu
  const generateFileName = (originalName) => {
    const base = originalName.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, "_");
    return `${base}_${Date.now()}`;
  };

  // Proses enkripsi dan upload ke IPFS
  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setMessage("🔐 Enkripsi file...");

      // Enkripsi file
      const encryptedBlob = await encryptFile(file);

      setMessage("📤 Mengunggah ke IPFS...");

      // Upload ke IPFS dan ambil CID
      const cid = await uploadToIPFS(encryptedBlob, file.name);

      const fileName = generateFileName(file.name);
      const timestamp = new Date().toISOString();

      // Tambahkan file ke manifest XML
      const updatedManifest = addFileToManifest(manifestXml, {
        name: fileName,
        cid,
        type,
        stage,
        timestamp,
      });

      // Update state
      setManifestXml(updatedManifest);
      setMessage(`✅ Berhasil! CID IPFS: ${cid}`);
      setFile(null); // Reset file input
    } catch (err) {
      console.error(err);
      setMessage("❌ Gagal mengunggah file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow mb-4">
      {/* Judul tahap */}
      <h3 className="font-semibold mb-2 capitalize">{stage} stage</h3>

      {/* Dropdown jenis data */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="mb-2 p-2 border rounded w-full"
      >
        <option value="lab_result">Lab Result</option>
        <option value="xray_image">X-Ray Image</option>
        <option value="ct_scan">CT Scan</option>
        <option value="clinician_note">Clinician Note</option>
        <option value="other">Other</option>
      </select>

      {/* Input file */}
      <input
        type="file"
        onChange={handleFileChange}
        className="mb-2 block w-full"
      />

      {/* Tombol upload */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {uploading ? "⏳ Memproses..." : "🔐 Enkripsi & Upload"}
      </button>

      {/* Status pesan */}
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default StageUploader;
