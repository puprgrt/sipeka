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
