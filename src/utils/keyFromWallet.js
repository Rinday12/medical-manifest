// src/utils/keyFromWallet.js
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

export async function getEncryptionKeyFromWallet() {
  if (!window.ethereum) throw new Error("MetaMask tidak ditemukan");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const address = await signer.getAddress();
  const message = `Authorize encryption key for: ${address}`;

  const signature = await signer.signMessage(message);

  // Gunakan hash dari signature sebagai kunci AES
  const key = CryptoJS.SHA256(signature).toString();
  return key; // ini akan digunakan untuk encrypt/decrypt file
}
