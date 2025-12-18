// src/components/ManifestFetcher.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  decryptEncryptedBlobToBlob as decryptBase64ToBlob,
  decryptTextFromBase64,
  generateKey,
  getMimeType
} from "../utils/encrypt";


import { parseManifestXML } from "../utils/manifest";

const ManifestFetcher = () => {
  const [patientId, setPatientId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [cid, setCid] = useState("");
  const [manifestData, setManifestData] = useState(null);
  const [error, setError] = useState(null);

  const getSessionKey = () => {
    if (!walletAddress || !patientId) {
      throw new Error(
        "Wallet address and Patient ID are required to generate decryption key."
      );
    }
    return generateKey(patientId, walletAddress);
  };

  const handleFetchManifest = async () => {
    try {
      setError(null);
      setManifestData(null);

      if (!cid) throw new Error("CID is required to fetch manifest from IPFS.");

      const ipfsResponse = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        { responseType: "text" }
      );
      const encryptedBase64 = ipfsResponse.data;

      const key = getSessionKey();
      const decryptedText = decryptTextFromBase64(encryptedBase64, key);

      const parsed = await parseManifestXML(decryptedText);
      setManifestData(parsed);
    } catch (err) {
      console.error("Error fetching or decrypting manifest:", err);
      setError("Failed to fetch or decrypt manifest.");
    }
  };

  const handleDownloadFile = async (cid, filename) => {
    try {
      const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        { responseType: "text" }
      );
      const encryptedBase64 = response.data;

      const key = getSessionKey();
      const mimeType = getMimeType(filename);

      const blob = decryptBase64ToBlob(encryptedBase64, mimeType, key);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert(`File ${filename} berhasil didownload`);
    } catch (err) {
      console.error("Gagal download file:", err);
      alert(`Gagal download file ${filename}: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Fetch & Decrypt Manifest
      </h2>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Manifest CID (from IPFS)"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleFetchManifest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition"
        >
          Fetch Manifest
        </button>
      </div>

      {error && (
        <div className="text-red-600 font-semibold mb-4 text-center">{error}</div>
      )}

      {manifestData && manifestData.length > 0 && (
        <div className="space-y-6">
          {manifestData.map((episode, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-3">Episode ID: {episode.id}</h3>

              {episode.files && episode.files.length > 0 ? (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {episode.files.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 shadow-inner"
                    >
                      <span className="truncate max-w-xs">{file.name}</span>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md text-sm font-medium transition"
                        onClick={() => handleDownloadFile(file.cid, file.name)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-500">No files in this episode.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {manifestData && (
        <div className="mt-8">
          <h3 className="font-bold text-lg mb-2">Raw Manifest JSON</h3>
          <pre className="bg-gray-100 p-4 rounded max-h-64 overflow-auto text-xs">
            {JSON.stringify(manifestData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ManifestFetcher;