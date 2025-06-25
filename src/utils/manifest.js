// src/utils/manifest.js
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { getFromIPFS } from "./ipfs";
import { decryptToBuffer } from "./encrypt";

const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

/**
 * Membuat manifest XML untuk satu episode baru
 */
export function createNewManifest(patientId, patientName, episodeId, startDate, endDate) {
  console.log("createNewManifest input:", {
    patientId,
    patientName,
    episodeId,
    startDate,
    endDate
  });

  const manifest = {
    Manifest: {
      Patient: {
        "@_id": patientId,
        "@_name": patientName, // pastikan ini bukan id
        Episode: {
          "@_id": episodeId,
          "@_start_date": startDate,
          "@_end_date": endDate,
          "@_cied": `CIED-${patientId}`,
          "@_description": "Data episode perawatan pasien",
          Stage: []
        }
      }
    }
  };
  return builder.build(manifest);
}


/**
 * Menambahkan file baru ke stage tertentu dalam manifest XML
 */
export function addFileToManifest(manifestXml, newFile) {
  const jsonObj = parser.parse(manifestXml);
  const episode = jsonObj.Manifest.Patient.Episode;

  // Pastikan array stage tersedia
  if (!episode.Stage) {
    episode.Stage = [];
  } else if (!Array.isArray(episode.Stage)) {
    episode.Stage = [episode.Stage];
  }

  // Cari atau buat stage sesuai nama
  let stage = episode.Stage.find(s => s['@_name'] === newFile.stage);
  if (!stage) {
    stage = { '@_name': newFile.stage, File: [] };
    episode.Stage.push(stage);
  }

  // Pastikan array file tersedia
  if (!stage.File) {
    stage.File = [];
  } else if (!Array.isArray(stage.File)) {
    stage.File = [stage.File];
  }

  // Tambahkan file ke stage
  stage.File.push({
    '@_name': newFile.name,
    '@_type': newFile.type,
    '@_cid': newFile.cid,
    '@_timestamp': newFile.timestamp
  });

  return builder.build(jsonObj);
}

/**
 * Mengambil file manifest dari IPFS dan mendekripsi
 */
export async function fetchAndDecryptManifest(cid, key) {
  const encryptedBase64 = await getFromIPFS(cid);
  const decryptedBuffer = decryptToBuffer(encryptedBase64, key);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(decryptedBuffer);
}

export function addEndDateToManifest(manifestXml, endDate) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(manifestXml, "application/xml");

  const episode = xmlDoc.querySelector("Episode");
  if (episode) {
    episode.setAttribute("end_date", endDate);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

