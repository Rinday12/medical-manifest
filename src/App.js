import React, { useState, useEffect } from "react";
import "./App.css";

import StageUploader from "./components/StageUploader";
import ManifestFetcher from "./components/ManifestFetcher";
import AccountCreator from "./components/AccountCreator";
import Section from "./components/Section";
import Label from "./components/Label";
import Input from "./components/Input";
import SubmitButton from "./components/SubmitButton";
import { QRCodeCanvas } from "qrcode.react";

import {
  setSessionKey,
  getSessionKey,
  encryptTextToBase64
} from "./utils/encrypt";
import { uploadToIPFS } from "./utils/ipfs";
import { sendCIDToSmartContract } from "./utils/contract";
import {
  createNewManifest,
  addEpisode,
  addEndDateToManifest,
  getPatientIdFromManifest,
  countEpisodesInManifest,
  episodeExistsInManifest
} from "./utils/manifest";

const stages = [
  "admission",
  "normal_ward",
  "procedures",
  "surgeries",
  "icu",
  "stabilization",
  "discharge"
];

const App = () => {
  const [patientId, setPatientId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [manifestXml, setManifestXml] = useState("");
  const [manifestReady, setManifestReady] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [cidResult, setCidResult] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [cid, setCid] = useState(null);
  const [episodeId, setEpisodeId] = useState("");

  useEffect(() => {
    if (!patientId.trim()) {
      setManifestXml("");
      setManifestReady(false);
      setEpisodeId("");
    }
  }, [patientId]);

  useEffect(() => {
    if (walletAddress && patientId) {
      setSessionKey(walletAddress, patientId);
    }
  }, [walletAddress, patientId]);

  const handleRegisterAccount = (account) => {
    setAccounts((prev) => [...prev, account]);
    alert(`${account.role} ${account.name} registered successfully!`);
  };

  const handleGenerateManifest = () => {
    const pid = patientId.trim();
    if (!pid) return alert("Please enter Patient ID.");

    const patient = accounts.find((a) => a.role === "patient" && a.id === pid);
    if (!patient) return alert("⚠️ Patient not registered. Please register patient account first.");

    let xml = manifestXml;
    if (!xml || getPatientIdFromManifest(xml) !== pid) {
      xml = createNewManifest(pid, patient.name);
    }

    const episodeCount = countEpisodesInManifest(xml) + 1;
    const newEpisodeId = `EPS-${episodeCount}`;

    if (!episodeExistsInManifest(xml, newEpisodeId)) {
      xml = addEpisode(xml, pid, patient.name, new Date().toISOString());
    }

    setEpisodeId(newEpisodeId);
    setManifestXml(xml);
    setManifestReady(true);
  };

  const handleSubmitManifest = async () => {
    if (!manifestXml) return alert("Manifest is empty. Please generate it first.");
    if (!walletAddress || !patientId) return alert("⚠️ Wallet address dan Patient ID wajib diisi.");

    try {
      const xmlWithEnd = addEndDateToManifest(manifestXml, episodeId, new Date().toISOString());
      if (typeof xmlWithEnd !== "string") throw new Error("Manifest XML is invalid");

      const sessionKey = getSessionKey();
      if (!sessionKey) throw new Error("Session key not found. Please re-enter wallet and patient ID.");

      const fileName = `manifest-${patientId}-${episodeId}-${new Date().toISOString()}.xml`;
      const encryptedBase64 = encryptTextToBase64(xmlWithEnd, sessionKey);
      const encryptedBlob = new Blob([encryptedBase64], { type: "text/plain" });

      const newCid = await uploadToIPFS(encryptedBlob, fileName);
      await sendCIDToSmartContract(newCid);
      await sendCIDToEMR(patientId, episodeId, newCid);

      localStorage.setItem(`manifestCID-${patientId}-${episodeId}`, newCid);
      setCidResult(newCid);
      setCid(newCid);
      alert("✅ Manifest submitted successfully!");
    } catch (err) {
      console.error("❌ Gagal submit manifest:", err);
      alert(`❌ Failed to submit manifest: ${err.message}`);
    }
  };

  const sendCIDToEMR = async (pid, eid, c) => {
    try {
      await fetch("http://127.0.0.1:5000/store-cid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: pid, episodeId: eid, cid: c })
      });
    } catch (e) {
      console.error("❌ Failed to send CID to EMR:", e);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => setCopySuccess("📋 Copied!"))
      .catch(() => setCopySuccess("❌ Failed to copy"));
    setTimeout(() => setCopySuccess(""), 2000);
  };

  return (
    <div className="app-container">
      <button className="btn-refresh" onClick={() => window.location.reload()}>
        Refresh Page
      </button>

      <Section title="Register Doctor or Patient Account" color="text-green-700">
        <AccountCreator onRegister={handleRegisterAccount} />
      </Section>

      {accounts.length > 0 && (
        <Section title="Registered Accounts">
          <ul>
            {accounts.map((a, i) => (
              <li key={i}>{a.role}: {a.name} — ID: {a.id}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Patient Data Uploader" color="text-blue-700">
        <Label>Patient ID:</Label>
        <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} />
        <Label>Wallet Address:</Label>
        <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
        <SubmitButton onClick={handleGenerateManifest}>Generate Manifest</SubmitButton>
      </Section>

      {manifestReady && (
        <Section title="Upload Files by Stage" color="text-indigo-700">
          {stages.map((stage) => (
            <StageUploader
              key={stage}
              stage={stage}
              manifestXml={manifestXml}
              setManifestXml={setManifestXml}
              patientId={patientId}
              episodeId={episodeId}
              walletAddress={walletAddress}
            />
          ))}

          <div>
            <Label>Preview Manifest:</Label>
            <pre className="manifest-preview">{manifestXml}</pre>
            <button onClick={() => handleCopy(manifestXml)}>Copy Manifest</button>
            {copySuccess && <span>{copySuccess}</span>}
          </div>

          <SubmitButton onClick={handleSubmitManifest}>Submit Manifest to Blockchain</SubmitButton>

          {cidResult && (
            <div>
              <Label>CID:</Label>
              <code>{cidResult}</code>
              <button onClick={() => handleCopy(cidResult)}>Copy CID</button>
            </div>
          )}

          {cid && (
            <div>
              <Label>QR Code:</Label>
              <QRCodeCanvas value={cid} size={120} />
            </div>
          )}
        </Section>
      )}

      <ManifestFetcher />
    </div>
  );
};

export default App;
