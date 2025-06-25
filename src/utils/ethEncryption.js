// Mengimpor library untuk mendeteksi provider MetaMask
import detectEthereumProvider from '@metamask/detect-provider';

// Mengimpor fungsi `encrypt` dari pustaka MetaMask untuk enkripsi data
import { encrypt } from '@metamask/eth-sig-util';

// Mengimpor fungsi utilitas untuk mengubah buffer ke hex
import { bufferToHex } from 'ethereumjs-util';

/**
 * Minta public key enkripsi dari MetaMask
 * @returns {Promise<string>} base64 public key
 */
export async function getEncryptionPublicKey() {
  // Deteksi apakah pengguna menggunakan MetaMask
  const provider = await detectEthereumProvider();

  // Jika tidak ditemukan, lemparkan error
  if (!provider) throw new Error("MetaMask tidak ditemukan");

  // Minta akses akun dari pengguna (akan memunculkan prompt MetaMask)
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Ambil address akun pertama
  const address = accounts[0];

  // Panggil metode eth_getEncryptionPublicKey dari MetaMask
  // Ini hanya tersedia jika akun MetaMask sudah aktif
  const pubKey = await window.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [address],
  });

  // Kembalikan public key dan alamat akun yang digunakan
  return { pubKey, address };
}
