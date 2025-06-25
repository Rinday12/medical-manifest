import { ethers } from "ethers";
import MedicalCID from "../contracts/MedicalCID.json";

const CONTRACT_ADDRESS = "0x87553d051e30d35cfcd80bc6ee67f84ad9d42864";

export const sendCIDToSmartContract = async (cid) => {
  if (!window.ethereum) throw new Error("MetaMask is not installed");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // MedicalCID adalah array ABI, langsung dipakai
  const contract = new ethers.Contract(CONTRACT_ADDRESS, MedicalCID, signer);

  const tx = await contract.storeCID(cid);
  await tx.wait();
};
