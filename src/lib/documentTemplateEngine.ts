import { createDocument } from './docsService';
import { getAccessToken } from './firebaseAuth';
import { makeFilePublic } from './driveService';
import { getValidationUrl } from './utils';

export interface DocumentTemplateData {
  id?: string;
  nama_sekolah?: string;
  npsn?: string;
  nama_bangunan?: string;
  nup?: string;
  alamat?: string;
  nomor_surat?: string;
  tanggal?: string;
  kerusakan?: number | string;
  kategori?: string;
  luas_bangunan?: number | string;
  jumlah_lantai?: number | string;
  koordinat_gps?: string;
  nama_pengirim?: string;
  jabatan_pengirim?: string;
  nip_pengirim?: string;
  nama_instansi_atas?: string;
  nama_instansi_bawah?: string;
  alamat_pemohon?: string;
  qr_data?: string;
}

export function generateQrCodeUrl(data: string): string {
  if (!data) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
}

export function renderDocumentTemplate(templateContent: string, data: DocumentTemplateData): string {
  const qrUrl = generateQrCodeUrl(data.qr_data || (data.id ? getValidationUrl(data.id) : data.nomor_surat || 'SIPEKA-TTE-VERIFIED'));
  const qrImageHtml = `<div style="text-align: center; margin: 16px 0;">
    <img src="${qrUrl}" alt="Barcode TTE" style="width: 120px; height: 120px; border: 1px solid #ccc; padding: 4px;" />
    <div style="font-size: 11px; color: #475569; margin-top: 4px;">Tanda Tangan Elektronik (TTE) SIPEKA PUPR</div>
  </div>`;

  let rendered = templateContent;

  const mapping: Record<string, string> = {
    '{{nama_sekolah}}': data.nama_sekolah || '-',
    '{{npsn}}': data.npsn || '-',
    '{{nama_bangunan}}': data.nama_bangunan || '-',
    '{{nup}}': data.nup || '-',
    '{{alamat}}': data.alamat || '-',
    '{{nomor_surat}}': data.nomor_surat || '-',
    '{{tanggal}}': data.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{{kerusakan}}': String(data.kerusakan || '0'),
    '{{kategori}}': data.kategori || '-',
    '{{luas_bangunan}}': String(data.luas_bangunan || '0'),
    '{{jumlah_lantai}}': String(data.jumlah_lantai || '1'),
    '{{koordinat_gps}}': data.koordinat_gps || '-',
    '{{nama_pengirim}}': data.nama_pengirim || '-',
    '{{jabatan_pengirim}}': data.jabatan_pengirim || '-',
    '{{nip_pengirim}}': data.nip_pengirim || '-',
    '{{nama_instansi_atas}}': data.nama_instansi_atas || 'PEMERINTAH KABUPATEN GARUT',
    '{{nama_instansi_bawah}}': data.nama_instansi_bawah || data.nama_sekolah || '-',
    '{{alamat_pemohon}}': data.alamat_pemohon || data.alamat || '-',
    '{{qr}}': qrImageHtml,
    '{{barcode_tte}}': qrImageHtml,
    '{{ttd}}': qrImageHtml,
  };

  Object.entries(mapping).forEach(([key, value]) => {
    rendered = rendered.split(key).join(value);
  });

  return rendered;
}

export async function copyGoogleDocTemplateAndReplace(
  templateId: string,
  newTitle: string,
  data: DocumentTemplateData,
  accessTokenOverride?: string | null
): Promise<string | null> {
  const token = accessTokenOverride ?? await getAccessToken();
  if (!token || token === 'mock' || token === 'test' || token.length < 20) {
    return null;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newTitle
      })
    });

    if (!res.ok) {
      return null;
    }

    const copiedDoc = await res.json();
    const docId = copiedDoc.id;
    if (!docId) return null;

    const replacements: Array<{ containsText: { text: string; matchCase: boolean }; replaceText: string }> = [
      { containsText: { text: '{{nama_sekolah}}', matchCase: true }, replaceText: data.nama_sekolah || '-' },
      { containsText: { text: '{{npsn}}', matchCase: true }, replaceText: data.npsn || '-' },
      { containsText: { text: '{{nama_bangunan}}', matchCase: true }, replaceText: data.nama_bangunan || '-' },
      { containsText: { text: '{{alamat}}', matchCase: true }, replaceText: data.alamat || '-' },
      { containsText: { text: '{{nomor_surat}}', matchCase: true }, replaceText: data.nomor_surat || '-' },
      { containsText: { text: '{{tanggal}}', matchCase: true }, replaceText: data.tanggal || '' },
      { containsText: { text: '{{kerusakan}}', matchCase: true }, replaceText: String(data.kerusakan || '0') },
      { containsText: { text: '{{kategori}}', matchCase: true }, replaceText: data.kategori || '-' },
      { containsText: { text: '{{nama_pengirim}}', matchCase: true }, replaceText: data.nama_pengirim || '-' },
      { containsText: { text: '{{nip_pengirim}}', matchCase: true }, replaceText: data.nip_pengirim || '-' },
    ];

    const requests = replacements.map(r => ({
      replaceAllText: r
    }));

    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    }).catch(console.warn);

    await makeFilePublic(docId).catch(console.warn);
    return `https://docs.google.com/document/d/${docId}/edit`;
  } catch (err) {
    console.warn('[DocumentTemplateEngine] Error in copyGoogleDocTemplateAndReplace:', err);
    return null;
  }
}

export async function generateDocumentFromTemplateEngine(
  title: string,
  templateContent: string,
  data: DocumentTemplateData,
  googleDocTemplateId?: string,
  accessTokenOverride?: string | null
): Promise<{ url: string; engine: 'google_drive_copy' | 'multipart_template_engine' }> {
  if (googleDocTemplateId) {
    const copiedUrl = await copyGoogleDocTemplateAndReplace(googleDocTemplateId, title, data, accessTokenOverride);
    if (copiedUrl) {
      return { url: copiedUrl, engine: 'google_drive_copy' };
    }
  }

  const renderedHtml = renderDocumentTemplate(templateContent, data);
  const url = await createDocument(title, renderedHtml, accessTokenOverride);
  return { url, engine: 'multipart_template_engine' };
}
