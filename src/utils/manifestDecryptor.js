import { getFromIPFS } from "./ipfs";
import { decryptToBuffer } from "./encrypt";

/**
 * Mengambil file manifest dari IPFS dan mendekripsinya.
 * @param {string} cid - CID dari file manifest terenkripsi
 * @param {string} key - Kunci enkripsi (sama dengan saat enkripsi)
 * @returns {Promise<string>} - XML hasil dekripsi
 */
export async function fetchAndDecryptManifest(cid, key) {
  const encryptedBase64 = await getFromIPFS(cid);
  const decryptedBuffer = decryptToBuffer(encryptedBase64, key);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(decryptedBuffer);
}
