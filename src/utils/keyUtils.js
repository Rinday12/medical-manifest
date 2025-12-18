// utils/keyUtils.js
import CryptoJS from "crypto-js";

export const deriveKey = (walletAddress, patientId) => {
  if (!walletAddress || !patientId) {
    throw new Error("walletAddress and patientId are required.");
  }
  const rawKey = `${walletAddress}-${patientId}`;
  return CryptoJS.SHA256(rawKey).toString();
};
