import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";

const AccountCreator = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [walletAddress, setWalletAddress] = useState("");
  const [id, setId] = useState("");
useEffect(() => {
  if (walletAddress && id) {
    const sessionKey = CryptoJS.SHA256(walletAddress + id).toString();
    sessionStorage.setItem("sessionKey", sessionKey);
  }
}, [walletAddress, id]);

  // Fungsi generator ID rumah sakit
  const generateHospitalId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RS${year}${month}${date}${random}`;
  };

  // Generate ID pertama kali saat komponen dimount
  useEffect(() => {
    setId(generateHospitalId());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !walletAddress || !id) {
      alert("Please fill in all fields.");
      return;
    }

    const account = {
      name: name.trim(),
      role: role.trim().toLowerCase(),
      walletAddress: walletAddress.trim(),
      id: id.trim(),
    };

    // Kirim data ke parent (atau proses selanjutnya)
    onRegister(account);

    // Reset semua field & generate ID baru
    setName("");
    setRole("patient");
    setWalletAddress("");
    setId(generateHospitalId());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Budi Santoso"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-700 mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-700 mb-1">Ethereum Address</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="e.g., 0xabc123..."
        />
      </div>

      <div>
        <label className="block font-medium text-gray-700 mb-1">Generated Hospital ID</label>
        <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-800">
          {id || "Generating..."}
        </div>
      </div>

      <button
        type="submit"
        className="btn-submit"
      >
        Register Account
      </button>
    </form>
  );
};

export default AccountCreator;
