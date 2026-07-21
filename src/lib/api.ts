import { supabase } from "./supabaseClient";
import { getAuditHeaders } from "./utils";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers);
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  // Also include the old audit headers temporarily for backward compatibility
  // until all endpoints strictly rely on req.user
  const auditHeaders = getAuditHeaders();
  for (const [key, value] of Object.entries(auditHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const newInit: RequestInit = {
    ...init,
    headers
  };

  const response = await fetch(input, newInit);
  
  // Optional: Handle 401 globally
  if (response.status === 401) {
    console.warn("API request failed with 401 Unauthorized. Token might be expired.");
    // In a full implementation, you could trigger a forced logout or refresh token here
  }

  return response;
}
