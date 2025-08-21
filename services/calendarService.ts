import API_CONFIG from '@/app/config/api';

interface CreateCalendarEventPayload {
  context: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  heur_debut?: string; // HH:MM | HH:MM:SS
  heur_fin?: string;   // HH:MM | HH:MM:SS
  module?: string;
  function?: string;
}

export async function createCalendarEvent(payload: CreateCalendarEventPayload, token: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/calendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create calendar event');
  }
  return data;
}


