import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

// Get the token from localStorage if it exists so reloading is persistent
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('firebase_google_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session && session.user) {
        // Extract provider_token from Supabase session if it exists (for Google APIs)
        if (session.provider_token) {
          cachedAccessToken = session.provider_token;
          if (typeof window !== 'undefined') {
            localStorage.setItem('firebase_google_access_token', cachedAccessToken);
          }
        } else if (!cachedAccessToken && typeof window !== 'undefined') {
           cachedAccessToken = localStorage.getItem('firebase_google_access_token');
        }

        if (onAuthSuccess) {
          // Format user to match expected shape slightly (if needed)
          const formattedUser = {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            photoURL: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ''
          };
          onAuthSuccess(formattedUser, cachedAccessToken || '');
        }
      } else {
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase_google_access_token');
        }
        if (onAuthFailure) onAuthFailure();
      }
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events',
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      throw error;
    }
    
    // Supabase OAuth redirects the page, so this will not return synchronously
    return null;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('firebase_google_access_token');
  }
  return cachedAccessToken;
};

export interface PersistedSession {
  email: string;
  displayName: string;
  role: string;
  userId?: string;
  photoURL?: string;
}

export function persistUserSession(session: PersistedSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', session.email);
  localStorage.setItem('userName', session.displayName);
  localStorage.setItem('activeRole', session.role);
  localStorage.setItem('actualRole', session.role);
  localStorage.setItem(
    'userPhoto',
    session.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  );
  if (session.userId) {
    localStorage.setItem('activeUserId', session.userId);
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('firebase_google_access_token');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPhoto');
  localStorage.removeItem('activeRole');
  localStorage.removeItem('actualRole');
  localStorage.removeItem('activeUserId');
}

export const emailPasswordSignIn = async (email: string, password: string): Promise<{ user: any; accessToken: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Email atau kata sandi salah.');
  }

  if (data.session.provider_token) {
    cachedAccessToken = data.session.provider_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_google_access_token', cachedAccessToken);
    }
  }

  const formattedUser = {
    uid: data.user.id,
    email: data.user.email,
    displayName:
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0],
    photoURL: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
  };

  return { user: formattedUser, accessToken: data.session.access_token };
};

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  clearUserSession();
};

// Mock functions to prevent imports from breaking in other files
export const changeFirebasePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const sendFirebasePasswordReset = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

