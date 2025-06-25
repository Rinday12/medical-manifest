import React, { useState, useEffect } from "react";
import "./App.css";

// Components
import StageUploader from "./components/StageUploader";
import ManifestFetcher from "./components/ManifestFetcher";
import AccountCreator from "./components/AccountCreator";
import Section from "./components/Section";
import Label from "./components/Label";
import Input from "./components/Input";
import SubmitButton from "./components/SubmitButton";

// Utilities
import { createNewManifest, addEndDateToManifest } from "./utils/manifest";
import { encryptText } from "./utils/encrypt";
import { uploadToIPFS } from "./utils/ipfs";
import { sendCIDToSmartContract } from "./utils/contract";
import { QRCodeCanvas } from 'qrcode.react'; // di bagian atas


const App = () => {
  // === States ===
  const [patientId, setPatientId] = useState("");
  const [episodeId, setEpisodeId] = useState("E01");
  const [manifestXml, setManifestXml] = useState("");
  const [manifestReady, setManifestReady] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [cidResult, setCidResult] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [cid, setCid] = useState(null);

  const stages = [
    "admission",
    "normal_ward",
    "procedures",
    "surgeries",
    "icu",
    "stabilization",
    "discharge",
  ];

  // === Handlers ===
  const handleRegisterAccount = (account) => {
    setAccounts((prev) => [...prev, account]);
    alert(`${account.role} ${account.name} registered successfully!`);
  };

  const handleGenerateManifest = () => {
    const trimmedId = patientId.trim();
    const trimmedEpisode = episodeId.trim();

    if (!trimmedId || !trimmedEpisode) {
      return alert("Please enter both Patient ID and Episode ID.");
    }

    const patientAccount = accounts.find(
      (acc) =>
        acc.role.toLowerCase() === "patient" &&
        acc.id.toLowerCase() === trimmedId.toLowerCase()
    );

    if (!patientAccount) {
      return alert("⚠️ Patient not registered. Please register patient account first.");
    }

    const manifest = createNewManifest(
      patientAccount.id,
      patientAccount.name,
      trimmedEpisode,
      new Date().toISOString(),
      ""
    );

    setManifestXml(manifest);
    setManifestReady(true);
  };

 const handleSubmitManifest = async () => {
  if (!manifestXml) return alert("Manifest is empty. Please generate it first.");

  try {
    const updatedManifest = addEndDateToManifest(manifestXml, new Date().toISOString());
    const timestamp = new Date().toISOString();
    const fileName = `manifest-${patientId}-${episodeId}-${timestamp}.xml`;

    const encrypted = await encryptText(updatedManifest);
    const cid = await uploadToIPFS(encrypted, fileName);

    // === Simpan ke State dan LocalStorage ===
    setCid(cid);
    localStorage.setItem(`manifestCID-${patientId}-${episodeId}`, cid);

    // === Simpan ke Smart Contract ===
    await sendCIDToSmartContract(cid);

    // === Kirim ke EMR ===
    await sendCIDToEMR(patientId, episodeId, cid);

    setCidResult(cid);
    alert("✅ Manifest submitted successfully!");
  } catch (error) {
    console.error("Error submitting manifest:", error);
    alert(`❌ Failed to submit manifest.\n${error.message}`);
  }
};

const sendCIDToEMR = async (patientId, episodeId, cid) => {
  try {
    await fetch("http://127.0.0.1:5000/store-cid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ patientId, episodeId, cid }),
    });
    console.log("✅ CID sent to EMR successfully");
  } catch (err) {
    console.error("❌ Failed to send CID to EMR:", err);
  }
};



  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => setCopySuccess("📋 Copied!"))
      .catch(() => setCopySuccess("❌ Failed to copy"));

    setTimeout(() => setCopySuccess(""), 2000);
  };

  useEffect(() => {
    if (!patientId.trim()) {
      setManifestXml("");
      setManifestReady(false);
    }
  }, [patientId]);




  // === Render ===
  return (
    <div className="app-container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button className="refresh-button" onClick={() => window.location.reload()}>
        Refresh Page
      </button>

      {/* 1. Register Account */}
      <Section title="Register Doctor or Patient Account" color="text-green-700">
        <AccountCreator onRegister={handleRegisterAccount} />
      </Section>

      {/* 2. List Registered Accounts */}
      {accounts.length > 0 && (
        <Section title="Registered Accounts">
          <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
            {accounts.map((acc, i) => (
              <li key={i}>
                <strong className="uppercase text-green-600">{acc.role}</strong>: {acc.name} — ID: {acc.id}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 3. Manifest Generator */}
      <Section title="Patient Data Uploader" color="text-blue-700">
        <Label htmlFor="patientId">Patient ID from Hospital:</Label>
        <Input
          id="patientId"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="e.g., RS20240678"
        />
        <Label htmlFor="episodeId">Episode ID:</Label>
        <Input
          id="episodeId"
          value={episodeId}
          onChange={(e) => setEpisodeId(e.target.value)}
          placeholder="e.g., E01, E02, etc."
        />
        <SubmitButton onClick={handleGenerateManifest}>Generate Manifest</SubmitButton>
      </Section>

      {/* 4. Upload Data & Submit Manifest */}
      {manifestReady && (
        <Section title="Upload Files by Stage" color="text-indigo-700">
          {stages.map((stage) => (
            <StageUploader
              key={stage}
              stage={stage}
              manifestXml={manifestXml}
              setManifestXml={setManifestXml}
            />
          ))}

          {/* Preview and Copy Manifest */}
          <div className="mt-4">
            <Label>Preview Manifest XML:</Label>
            <pre className="manifest-preview bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {manifestXml}
            </pre>
            <button
              className="mt-2 bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded text-sm"
              onClick={() => handleCopy(manifestXml)}
            >
              📋 Copy Manifest
            </button>
            {copySuccess && <span className="ml-3 text-green-600 text-sm">{copySuccess}</span>}
          </div>

          {/* Submit to Blockchain */}
          <SubmitButton onClick={handleSubmitManifest}>
            Submit Manifest to Blockchain
          </SubmitButton>

          {/* Display CID Result with Copy */}
          {cidResult && (
            <div className="mt-4">
              <Label>CID stored on blockchain:</Label>
              <div className="bg-purple-50 p-3 rounded flex items-center text-sm shadow-sm">
                <code className="flex-1 truncate">{cidResult}</code>
                <button
                  className="ml-3 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                  onClick={() => handleCopy(cidResult)}
                >
                  📋 Copy CID
                </button>
              </div>
            </div>
          )}
          {/* Tampilkan QR Code */}
{cid && (
  <div className="mt-4">
    <Label>QR Code of CID:</Label>
    <QRCodeCanvas value={cid} size={150} />
    <p className="text-sm mt-2 text-gray-600">{cid}</p>
  </div>
)}
        </Section>
      )}

      {/* 5. Fetch CID */}
      <ManifestFetcher />
    </div>
  );
 
};

export default App;
