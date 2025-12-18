// Import XML builder & parser dari fast-xml-parser
import { XMLBuilder, XMLParser } from "fast-xml-parser";

// Import fungsi untuk ambil file dari IPFS
import { getFromIPFS } from "./ipfs";

// Import fungsi dekripsi dan deteksi MIME
import {
  decryptEncryptedBlobToBlob as decryptBase64ToBlob,
  decryptTextFromBase64,
  getMimeType
} from "./encrypt";



// Konfigurasi XML builder
const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

// Konfigurasi XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

/**
 * Membuat struktur XML manifest awal untuk satu pasien
 */
export function createNewManifest(patientId, patientName) {
  const manifestId = `${patientId}-${Math.floor(1000 + Math.random() * 9000)}`; // ID unik
  const manifest = {
    Manifest: {
      '@_id': manifestId,
      Patient: {
        '@_id': patientId,
        '@_name': patientName,
        Episode: [] // episode akan ditambahkan belakangan
      }
    }
  };
  return builder.build(manifest); // kembalikan bentuk string XML
}

/**
 * Menambahkan satu episode baru ke dalam manifest
 */
export function addEpisode(manifestXml, patientId, patientName, newStartDate) {
  let parsed;
  try {
    parsed = manifestXml ? parser.parse(manifestXml) : { Manifest: null };
  } catch {
    parsed = { Manifest: null }; // fallback jika parsing gagal
  }

  // Jika tidak ada manifest, buat yang baru
  if (!parsed.Manifest) {
    parsed = parser.parse(createNewManifest(patientId, patientName));
  }

  const patient = parsed.Manifest.Patient;

  // Normalisasi Episode menjadi array
  patient.Episode = Array.isArray(patient.Episode)
    ? patient.Episode
    : (patient.Episode ? [patient.Episode] : []);

  const episodes = patient.Episode;

  // Tutup episode terakhir dengan tanggal baru
  if (episodes.length > 0) {
    episodes[episodes.length - 1]['@_end_date'] = newStartDate;
  }

  const episodeCount = episodes.length + 1;
  const newEpisodeId = `EPS-${episodeCount}`;

  // Tambahkan episode baru
  episodes.push({
    '@_id': newEpisodeId,
    '@_start_date': newStartDate,
    '@_end_date': '',
    '@_cied': `CIED-${patientId}`,
    '@_description': 'Data episode perawatan pasien',
    Stage: [] // stage diisi saat upload file
  });

  return builder.build(parsed); // kembalikan manifest yang sudah ditambahkan episode
}

/**
 * Menambahkan file ke episode dan stage tertentu dalam manifest
 */
export function addFileToManifest(manifestXml, fileData, patientId, episodeId, stage) {
  let parsed;
  try {
    parsed = manifestXml ? parser.parse(manifestXml) : { Manifest: null };
  } catch {
    parsed = { Manifest: null };
  }

  if (!parsed.Manifest) {
    parsed = parser.parse(createNewManifest(patientId, "Unknown"));
  }

  const patient = parsed.Manifest.Patient;

  // Normalisasi Episode jadi array
  patient.Episode = Array.isArray(patient.Episode)
    ? patient.Episode
    : (patient.Episode ? [patient.Episode] : []);

  // Cari episode yang cocok, jika tidak ada, buat baru
  let episode = patient.Episode.find(e => e['@_id'] === episodeId);
  if (!episode) {
    episode = {
      '@_id': episodeId,
      '@_start_date': new Date().toISOString(),
      '@_end_date': '',
      '@_cied': `CIED-${patientId}`,
      '@_description': 'Data episode perawatan pasien',
      Stage: []
    };
    patient.Episode.push(episode);
  }

  // Normalisasi stage
  episode.Stage = Array.isArray(episode.Stage)
    ? episode.Stage
    : (episode.Stage ? [episode.Stage] : []);

  // Cari stage, kalau belum ada, buat baru
  let stageNode = episode.Stage.find(s => s['@_stage_name'] === stage);
  if (!stageNode) {
    stageNode = { '@_stage_name': stage, File: [] };
    episode.Stage.push(stageNode);
  }

  // Normalisasi File
  stageNode.File = Array.isArray(stageNode.File)
    ? stageNode.File
    : (stageNode.File ? [stageNode.File] : []);

  // Tambahkan metadata file yang telah dienkripsi dan diupload ke IPFS
  stageNode.File.push({
    '@_cid': fileData.cid,
    '@_name': fileData.name,
    '@_mime': fileData.mime, // penting saat dekripsi
    '@_timestamp': fileData.timestamp
  });

  return builder.build(parsed); // kembalikan manifest XML
}

/**
 * Menambahkan end_date ke episode tertentu dalam XML
 */
export function addEndDateToManifest(manifestXml, episodeId, endDate) {
  const xmlDoc = new DOMParser().parseFromString(manifestXml, "application/xml");
  const episodes = xmlDoc.querySelectorAll("Episode");

  episodes.forEach(ep => {
    if (ep.getAttribute("id") === episodeId) {
      ep.setAttribute("end_date", endDate); // tambahkan tanggal selesai
    }
  });

  return new XMLSerializer().serializeToString(xmlDoc); // kembalikan XML yang diperbarui
}

/**
 * Mengambil dan mendekripsi manifest dari IPFS menggunakan CID dan kunci
 */
export async function fetchAndDecryptManifest(cid, key) {
  const encryptedBase64 = await getFromIPFS(cid);
  const decryptedBytes = await decryptTextFromBase64(encryptedBase64, key); // ✅ await ditambahkan
  return new TextDecoder("utf-8").decode(decryptedBytes);
}


/**
 * Ambil ID pasien dari XML manifest
 */
export function getPatientIdFromManifest(manifestXml) {
  try {
    const parsed = parser.parse(manifestXml);
    return parsed.Manifest.Patient['@_id'];
  } catch {
    return null;
  }
}

/**
 * Cek apakah episode dengan ID tertentu sudah ada
 */
export function episodeExistsInManifest(manifestXml, episodeId) {
  try {
    const parsed = parser.parse(manifestXml);
    const eps = parsed.Manifest.Patient.Episode;
    if (!eps) return false;
    return Array.isArray(eps)
      ? eps.some(e => e['@_id'] === episodeId)
      : eps['@_id'] === episodeId;
  } catch {
    return false;
  }
}

/**
 * Hitung total episode dalam manifest
 */
export function countEpisodesInManifest(manifestXml) {
  try {
    const parsed = parser.parse(manifestXml);
    const episodes = parsed.Manifest?.Patient?.Episode;
    if (!episodes) return 0;
    return Array.isArray(episodes) ? episodes.length : 1;
  } catch {
    return 0;
  }
}

/**
 * Mendownload dan mendekripsi file dari IPFS berdasarkan CID
 */
export async function decryptAndDownloadFile(cid, key, fileName = "downloaded") {
  const b64 = await getFromIPFS(cid); // ambil file terenkripsi dari IPFS
  const mime = getMimeType(fileName); // deteksi MIME
  const blob = decryptBase64ToBlob(b64, key, mime); // dekripsi jadi blob

  // Proses untuk mendownload blob
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseManifestXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const episodes = Array.from(xmlDoc.getElementsByTagName("Episode")).map((episode) => {
    const id = episode.getAttribute("id");
    const files = Array.from(episode.getElementsByTagName("File")).map((file) => ({
      cid: file.getAttribute("cid"),
      name: file.getAttribute("name"),
      type: file.getAttribute("type"),
      timestamp: file.getAttribute("timestamp"),
    }));
    return { id, files };
  });

  return episodes;
}
