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
  if (typeof window !== 'undefined' && typeof window.URL !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
    const html = `<!doctype html>
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

  return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
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
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.warn(`Google Docs create failed (${createRes.status}), using local preview fallback`, errorText);
      return createFallbackDocumentPreview(title, content);
    }

    const doc = await createRes.json();
    const docId = doc.documentId;

    if (!docId) {
      throw new Error('Google Docs returned no documentId');
    }

    if (content) {
      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: content
              }
            }
          ]
        })
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.warn(`Google Docs update failed (${updateRes.status}), using local preview fallback`, errorText);
        return createFallbackDocumentPreview(title, content);
      }
    }

    await makeFilePublic(docId).catch(console.warn);
    return `https://docs.google.com/document/d/${docId}/edit`;
  } catch (error) {
    console.warn('Google Docs API unavailable, using local preview fallback', error);
    return createFallbackDocumentPreview(title, content);
  }
}
