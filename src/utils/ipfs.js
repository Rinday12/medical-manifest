// utils/ipfs.js

import axios from "axios";

// ============================
// UPLOAD FILE TO IPFS (PINATA)
// ============================
export const uploadToIPFS = async (fileBlob, filename = "file") => {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const formData = new FormData();
  formData.append("file", fileBlob, filename);

  try {
    const res = await axios.post(url, formData, {
      maxBodyLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
      },
    });

    return res.data.IpfsHash; // CID
  } catch (error) {
    console.error("❌ Pinata upload failed:", error.response?.data || error.message);
    throw new Error("Upload to IPFS failed");
  }
};

// ============================
// DOWNLOAD FILE FROM IPFS
// ============================
export const getFromIPFS = async (cid) => {
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IPFS fetch error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text(); // digunakan untuk file terenkripsi atau XML
    return text;
  } catch (error) {
    console.error("❌ Fetch from IPFS failed:", error.message);
    throw new Error("Failed to retrieve file from IPFS");
  }
};
