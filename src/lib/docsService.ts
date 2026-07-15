import { getAccessToken } from './firebaseAuth';
import { makeFilePublic } from './driveService';

export async function createDocument(title: string, content: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  // Create empty document
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
  
  const doc = await createRes.json();
  const docId = doc.documentId;

  // Insert content
  if (content) {
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
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
  }

  // Make the document publicly viewable
  await makeFilePublic(docId).catch(console.error);

  return `https://docs.google.com/document/d/${docId}/edit`;
}
