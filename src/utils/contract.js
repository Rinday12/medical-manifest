import { ethers } from "ethers";
import MedicalCID from "../contracts/MedicalCID.json";

const CONTRACT_ADDRESS = "0x87553d051e30d35cfcd80bc6ee67f84ad9d42864";

export const sendCIDToSmartContract = async (cid) => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    MedicalCID,
    signer
  );

  // 🔥 LEGACY GAS (ANTI METAMASK BUG)
  const tx = await contract.storeCID(cid, {
    gasLimit: 300000n,
    gasPrice: ethers.parseUnits("10", "gwei"), // 👈 PENTING
  });

  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Tx confirmed");
};
