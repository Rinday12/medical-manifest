import { ethers } from "ethers";

// Pesan tetap yang akan ditandatangani setiap kali untuk derive key
const SIGN_MESSAGE = "🔐 Accessing encryption key for Medical Manifest";

export async function getEncryptionKeyFromWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // 1️⃣ Tanda tangani pesan
  const signature = await signer.signMessage(SIGN_MESSAGE);

  // 2️⃣ Gabungkan address dan signature → derive key
  const keyMaterial = address + signature;

  // 3️⃣ Hash jadi key (32 byte)
  return ethers.sha256(ethers.toUtf8Bytes(keyMaterial));
}
