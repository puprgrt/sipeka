import { supabase } from "./supabaseClient";

function shouldUseJsonContentType(body: BodyInit | null | undefined): boolean {
  if (body == null) return false;

  return !(body instanceof FormData)
    && !(body instanceof Blob)
    && !(body instanceof ArrayBuffer)
    && !ArrayBuffer.isView(body)
    && !(body instanceof URLSearchParams)
    && !(typeof ReadableStream !== "undefined" && body instanceof ReadableStream);
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers);
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const hasExplicitContentType = headers.has("Content-Type") || headers.has("content-type");
  if (shouldUseJsonContentType(init?.body) && !hasExplicitContentType) {
    headers.set("Content-Type", "application/json");
  } else if (!shouldUseJsonContentType(init?.body)) {
    headers.delete("Content-Type");
    headers.delete("content-type");
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
