import { apiFetch } from './api';
import { persistUserSession } from './firebaseAuth';

export async function syncSessionFromProfile(email: string, fallbackName?: string): Promise<void> {
  const profileRes = await apiFetch(`/api/profile?email=${encodeURIComponent(email)}`);
  if (!profileRes.ok) {
    throw new Error('Profil pengguna tidak ditemukan di sistem.');
  }

  const profile = await profileRes.json();
  persistUserSession({
    email: profile.email || email,
    displayName: profile.namaLengkap || fallbackName || email.split('@')[0],
    role: profile.role || 'Pengelola_Bangunan',
    userId: profile.idUser ? String(profile.idUser) : undefined,
    photoURL: profile.photoURL || undefined,
  });
}
