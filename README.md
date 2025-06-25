
# medical-manifest

`medical-manifest` is a Web3-based project for managing encrypted manifest files of medical records. It leverages **IPFS**, **Ethereum smart contracts**, and **React** to enable decentralized, secure, and episode-based storage and retrieval of patient data.

## 🧠 Project Purpose

This system is designed to:
- Store encrypted manifest files per patient visit/episode
- Ensure immutability and traceability of medical data using smart contracts
- Use IPFS for decentralized off-chain storage
- Maintain high data privacy by storing only the CID (Content Identifier) on-chain

## 🔐 Key Features

- Manifest files contain references to structured, semi-structured, and unstructured data (e.g. XML lab reports, medical images)
- Files are encrypted before being uploaded to IPFS
- CID of the encrypted manifest is stored in a smart contract on Ethereum (Sepolia testnet)
- Optional integration with EMR systems via API
- Patient episodes tracked via manifest metadata (episode ID, timestamps, and descriptions)

## ⚙️ Tech Stack

| Component          | Technology           |
|--------------------|----------------------|
| Frontend           | React + Tailwind CSS |
| Decentralized File | IPFS via Pinata API  |
| Blockchain Layer   | Ethereum + Solidity  |
| Smart Contract Dev | Hardhat              |
| Encryption         | Web Crypto API       |
| Backend (Optional) | Flask (Python)       |

## 🚀 Getting Started

### Prerequisites
- Node.js
- MetaMask
- Pinata account (for IPFS)
- Ethereum wallet (e.g. Sepolia testnet)

### Setup Instructions

```bash
# 1. Clone this repository
git clone https://github.com/your-username/medical-manifest.git
cd medical-manifest

# 2. Install frontend dependencies
npm install

# 3. Start the React development server
npm run dev

# 4. Compile & deploy smart contracts (optional)
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia

🧪 Research Context
This repository supports a research project focused on secure and decentralized electronic medical record (EMR) systems using blockchain. It demonstrates how medical data can be stored in a privacy-preserving and interoperable manner by combining:

IPFS for off-chain encrypted file storage

Ethereum smart contracts for immutable metadata recording

📬 Contact
If you have questions or want to collaborate:

Name: Rinday Zildjiani Salji

Email: rindayzildzianisalji@gmail.com

University: Universitas Ahmad Dahlan

