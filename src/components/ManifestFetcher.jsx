// components/ManifestFetcher.jsx

import React, { useState } from "react";
import { fetchAndDecryptManifest } from "../utils/manifestDecryptor";

const ManifestFetcher = () => {
  const [cid, setCid] = useState("");
  const [key, setKey] = useState("default-secret-key");
  const [manifestXml, setManifestXml] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cidLogs, setCidLogs] = useState([]);
const [logError, setLogError] = useState("");


const handleFetch = async () => {
  setError("");
  setManifestXml("");
  setLoading(true);

  try {
    // Kirim CID ke backend Flask untuk logging
    const backendResponse = await fetch("http://localhost:5000/fetch-cid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cid }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      throw new Error(backendData.error || "Gagal dari backend.");
    }

    console.log("📡 CID logged ke Flask:", backendData);

    // Lanjut ke pengambilan dan dekripsi manifest
    const decryptedXml = await fetchAndDecryptManifest(cid, key);
    setManifestXml(decryptedXml);
  } catch (err) {
    setError("❌ Gagal mengambil atau mendekripsi manifest.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
const fetchCidLogs = async () => {
  setLogError("");
  try {
    const res = await fetch("http://localhost:5000/get-cids");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Gagal ambil log CID");
    }

    setCidLogs(data);
  } catch (err) {
    setLogError("❌ Gagal mengambil log CID");
    console.error(err);
  }
};

  return (
    <div className="app-container">
      <h2>Ambil & Dekripsi Manifest</h2>

      <label htmlFor="cid">CID dari Blockchain</label>
      <input
        id="cid"
        type="text"
        placeholder="Contoh: QmXyZ..."
        value={cid}
        onChange={(e) => setCid(e.target.value)}
      />

      <label htmlFor="key">Kunci Enkripsi</label>
      <input
        id="key"
        type="password"
        placeholder="Masukkan kunci enkripsi"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <button
  onClick={fetchCidLogs}
  className="btn-secondary"
  style={{ marginTop: "12px" }}
>
  📜 Ambil Log CID dari Backend
</button>


      <button
        onClick={handleFetch}
        disabled={loading || !cid}
        className="btn-submit"
        style={{
          backgroundColor: loading || !cid ? "#9ca3af" : undefined,
          cursor: loading || !cid ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "🔄 Mengambil..." : "🔓 Ambil & Dekripsi"}
      </button>

      {error && <p style={{ color: "#dc2626", marginTop: "8px" }}>{error}</p>}

      {manifestXml && (
        <>
          <h3>📄 Hasil Manifest XML</h3>
          <div className="manifest-preview">{manifestXml}</div>
        </>
      )}
      {cidLogs.length > 0 && (
  <>
    <h3>📋 Riwayat CID</h3>
    <ul className="cid-log-list">
      {cidLogs.map((log) => (
        <li key={log.id}>
          <strong>{log.cid}</strong> — {new Date(log.timestamp).toLocaleString()} — IP: {log.requester_info}
        </li>
      ))}
    </ul>
  </>
)}

{logError && <p style={{ color: "#b91c1c" }}>{logError}</p>}

    </div>
  );
};

export default ManifestFetcher;
