import { getAccessToken } from './firebaseAuth';

export async function createCalendarEvent(summary: string, description: string, startTime: Date, endTime: Date) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      }
    })
  });

  if (!res.ok) {
    throw new Error('Failed to create calendar event');
  }

  const data = await res.json();
  return data.htmlLink;
}

export function promptSurveyScheduleTimes(): { startTime: Date; endTime: Date } | null {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().slice(0, 10) + " 09:00";
  const inputDateStr = prompt(
    "Masukkan rencana tanggal & waktu survei lapangan (format: YYYY-MM-DD HH:mm):",
    defaultDateStr
  );
  if (!inputDateStr) return null;

  const startTime = new Date(inputDateStr);
  if (isNaN(startTime.getTime())) {
    alert("Format tanggal/waktu tidak valid. Gunakan format YYYY-MM-DD HH:mm (contoh: 2026-08-05 09:00)");
    return null;
  }

  const endTime = new Date(startTime.getTime() + 2 * 3600000); // 2 jam durasi survei
  return { startTime, endTime };
}
