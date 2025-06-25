import { encryptText } from './encrypt';
import { uploadToIPFS } from './ipfs';
import { sendCIDToSmartContract } from './contract';

/**
 * Proses enkripsi -> upload IPFS -> simpan CID ke blockchain.
 * @param {string} manifestXml 
 * @returns {Promise<string>} CID
 */
export async function processManifestPipeline(manifestXml) {
  try {
    const encrypted = await encryptText(manifestXml);         // Enkripsi
    const cid = await uploadToIPFS(encrypted);                // Upload ke IPFS
    await sendCIDToSmartContract(cid);                        // Entri ke Blockchain
    return cid;
  } catch (error) {
    console.error("Pipeline error:", error);
    throw error;
  }
}
