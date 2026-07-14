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
            displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            photoURL: session.user.user_metadata?.avatar_url || ''
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
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined
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

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('firebase_google_access_token');
    // Also clear other SIPEKA custom local storage items
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("actualRole");
    localStorage.removeItem("activeUserId");
  }
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

