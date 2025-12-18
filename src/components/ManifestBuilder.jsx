// src/components/ManifestBuilder.jsx
import React, { useState } from "react";
import { addFileToManifest } from "../utils/manifest";

const ManifestBuilder = ({ manifestXml, setManifestXml, patientId, episodeId }) => {
  const [cid, setCid] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("lab_result");
  const [stage, setStage] = useState("admission");

  const handleAdd = async () => {
    if (!cid || !name || !patientId || !episodeId) return;

    const updated = await addFileToManifest(manifestXml, {
      name,
      cid,
      type,
      stage,
      timestamp: new Date().toISOString(),
    }, patientId, episodeId, stage);

    setManifestXml(updated);
    setCid("");
    setName("");
  };

  return (
    <div className="border rounded p-4 mb-4 bg-gray-50">
      <h3 className="font-semibold mb-2 text-purple-700">Manual Add CID to Manifest</h3>

      <input
        type="text"
        placeholder="CID"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        className="border p-1 w-full mb-2"
      />

      <input
        type="text"
        placeholder="File Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-1 w-full mb-2"
      />

      <select value={type} onChange={(e) => setType(e.target.value)} className="mb-2 p-1 w-full">
        <option value="lab_result">Lab Result</option>
        <option value="xray_image">X-Ray Image</option>
        <option value="ct_scan">CT Scan</option>
        <option value="clinician_note">Clinician Note</option>
        <option value="other">Other</option>
      </select>

      <select value={stage} onChange={(e) => setStage(e.target.value)} className="mb-2 p-1 w-full">
        <option value="admission">Admission</option>
        <option value="normal_ward">Normal Ward</option>
        <option value="procedures">Procedures</option>
        <option value="surgeries">Surgeries</option>
        <option value="icu">ICU</option>
        <option value="stabilization">Stabilization</option>
        <option value="discharge">Discharge</option>
      </select>

      <button
        onClick={handleAdd}
        className="bg-purple-600 text-white px-3 py-1 rounded"
      >
        Add to Manifest
      </button>
    </div>
  );
};

export default ManifestBuilder;
