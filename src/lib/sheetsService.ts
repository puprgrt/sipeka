import { getAccessToken } from './firebaseAuth';
import { makeFilePublic } from './driveService';

export async function appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    })
  });

  if (!res.ok) {
    throw new Error('Failed to append to sheet');
  }

  return await res.json();
}

export async function createSpreadsheet(title: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      }
    })
  });

  if (!res.ok) {
    throw new Error('Failed to create spreadsheet');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  
  // Make the spreadsheet publicly viewable
  await makeFilePublic(spreadsheetId).catch(console.error);
  
  return spreadsheetId;
}
