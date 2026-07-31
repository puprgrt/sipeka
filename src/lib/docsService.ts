import { getAccessToken } from './firebaseAuth';
import { makeFilePublic } from './driveService';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createFallbackDocumentPreview(title: string, content: string): string {
  const isHtml = /<html|<style|<div|<table|<p\b|<body|<!doctype/i.test(content);
  if (typeof window !== 'undefined' && typeof window.URL !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
    const html = isHtml ? content : `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; line-height: 1.6; color: #0f172a; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      pre { white-space: pre-wrap; word-break: break-word; background: #f8fafc; padding: 16px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <pre>${escapeHtml(content)}</pre>
  </body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  const fallbackText = isHtml ? content : `<!doctype html><html><body><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(content)}</pre></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(fallbackText)}`;
}

function hasUsableGoogleToken(token: string | null | undefined): boolean {
  if (!token) return false;

  const normalizedToken = token.trim();
  if (!normalizedToken) return false;
  if (['mock', 'test', 'undefined', 'null'].includes(normalizedToken.toLowerCase())) return false;

  return normalizedToken.length >= 20;
}

export async function createDocument(title: string, content: string, accessTokenOverride?: string | null): Promise<string> {
  const token = accessTokenOverride ?? await getAccessToken();
  if (!hasUsableGoogleToken(token)) {
    console.warn('Google Docs token unavailable or invalid, using local preview fallback');
    return createFallbackDocumentPreview(title, content);
  }

  try {
    const isHtml = /<html|<style|<div|<table|<p\b|<body|<!doctype/i.test(content);
    const contentType = isHtml ? 'text/html' : 'text/plain';

    const metadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
    };

    const boundary = '-------314159265358979323846264338327950288';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${contentType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.warn(`Google Drive create document failed (${createRes.status}), using local preview fallback`, errorText);
      return createFallbackDocumentPreview(title, content);
    }

    const doc = await createRes.json();
    const docId = doc.id;

    if (!docId) {
      throw new Error('Google Drive returned no id for created document');
    }

    await makeFilePublic(docId).catch(console.warn);
    return `https://docs.google.com/document/d/${docId}/edit`;
  } catch (error) {
    console.warn('Google Docs API unavailable, using local preview fallback', error);
    return createFallbackDocumentPreview(title, content);
  }
}
