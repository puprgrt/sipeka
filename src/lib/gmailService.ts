import { getAccessToken } from './firebaseAuth';

export async function sendEmail(to: string, subject: string, bodyText: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    bodyText
  ];

  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64EncodedEmail
    })
  });

  if (!res.ok) {
    throw new Error('Failed to send email');
  }

  return await res.json();
}
