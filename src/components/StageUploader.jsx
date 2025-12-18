import React, { useEffect, useState } from "react";
import { getMimeType, setSessionKey, getSessionKey } from "../utils/encrypt";
import { uploadToIPFS } from "../utils/ipfs";
import { addFileToManifest } from "../utils/manifest";

export default function StageUploader({
  stage,
  manifestXml,
  setManifestXml,
  patientId,
  episodeId,
  walletAddress,
}) {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("lab_result");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Label tampilan untuk tipe data
  const typeLabels = {
    lab_result: "Lab Result",
    xray_image: "XRay Thorax",
    ct_scan: "CT Scan",
    clinician_note: "Clinician Note",
    other: "Other",
  };

  // Set session key sekali saat wallet & patient tersedia
  useEffect(() => {
    if (!walletAddress || !patientId) return;
    try {
      setSessionKey(walletAddress, patientId);
    } catch (err) {
      console.error("❌ Gagal set session key:", err?.message || err);
    }
  }, [walletAddress, patientId]);

  const generateFileName = () => {
    const now = new Date();
    const y = String(now.getFullYear()).slice(2);
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const ext = file ? "." + file.name.split(".").pop() : "";
    return `${y}-${m}-${d} ${typeLabels[type] || type}${ext}`;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size === 0) {
      setMsg("⚠️ File kosong tidak dapat diproses.");
      setFile(null);
      return;
    }

    setFile(selected);
    setMsg("");
  };

  // Enkripsi satu chunk menggunakan AES-GCM
  const encryptChunk = async (chunk, rawKey) => {
    const keyBytes = new TextEncoder().encode(rawKey).slice(0, 32);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      chunk
    );

    // Gabungkan IV + ciphertext
    const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.byteLength);
    return combined;
  };

  const handleUpload = async () => {
    if (!walletAddress || !patientId) {
      setMsg("❌ Wallet address dan Patient ID wajib diisi.");
      return;
    }
    if (!file) {
      setMsg("❌ File belum dipilih.");
      return;
    }

    try {
      setBusy(true);
      setMsg("🔐 Mengenkripsi file per-stream…");

      const sessionKey = getSessionKey(walletAddress, patientId);
      if (!sessionKey) {
        throw new Error("Session key tidak ditemukan. Silakan login ulang.");
      }

      const reader = file.stream().getReader();
      const encryptedChunks = [];
      let index = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        index += 1;
        const encryptedChunk = await encryptChunk(value, sessionKey);
        encryptedChunks.push(encryptedChunk);
        setMsg(`🔐 Enkripsi chunk ke-${index}`);
      }

      const encryptedBlob = new Blob(encryptedChunks, {
        type: "application/octet-stream",
      });

      const fileName = generateFileName();
      setMsg("📤 Mengunggah file terenkripsi ke IPFS…");
      const cid = await uploadToIPFS(encryptedBlob, fileName);

      const updatedManifest = addFileToManifest(
        manifestXml,
        {
          name: fileName,
          cid,
          mime: file.type || getMimeType(fileName),
          timestamp: new Date().toISOString(),
        },
        patientId,
        episodeId,
        stage
      );

      setManifestXml(updatedManifest);
      setMsg(`✅ Upload sukses. CID: ${cid}`);
      setFile(null);
    } catch (err) {
      console.error("❌ Gagal upload:", err);
      setMsg(`❌ Gagal upload: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow mb-4 bg-white">
      <h3 className="font-semibold mb-2 capitalize">{stage} stage</h3>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="mb-2 p-2 border rounded w-full"
      >
        {Object.entries(typeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input type="file" onChange={handleFileChange} className="mb-2 block w-full" />

      <button
        onClick={handleUpload}
        disabled={busy || !file}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {busy ? "⏳ Memproses…" : "🔐 Enkripsi & Upload"}
      </button>

      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
