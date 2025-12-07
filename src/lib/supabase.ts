const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local"
  );
}

// Optional: official Supabase client for richer features
// Keeps existing REST helpers; use `supabaseClient` where beneficial (e.g., messaging)
import { createClient } from '@supabase/supabase-js';
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    },
  },
});

// Helper to get auth token from localStorage
const getAuthToken = (): string => {
  const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const authData = localStorage.getItem(storageKey);
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.access_token || supabaseAnonKey;
    } catch (e) {
      return supabaseAnonKey;
    }
  }
  return supabaseAnonKey;
};

// Helper to make authenticated requests to Supabase REST API
export const supabaseFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  return fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// Auth namespace for Supabase Auth API
export const supabaseAuth = {
  async signUp(email: string, password: string) {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const result = await response.json();
    
    // Store the session in localStorage if signup was successful
    if (result.access_token && !result.error) {
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        token_type: result.token_type,
        user: result.user,
      }));
    }
    
    return result;
  },

  async signInWithPassword(email: string, password: string) {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const result = await response.json();
    
    // Store the session in localStorage like Supabase client does
    if (result.access_token && !result.error) {
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        token_type: result.token_type,
        user: result.user,
      }));
    }
    
    return result;
  },

  async signOut() {
    const token = getAuthToken();
    const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Clear local storage
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    localStorage.removeItem(storageKey);
    
    return response;
  },

  async getSession() {
    const token = getAuthToken();
    if (token === supabaseAnonKey) {
      return { data: { session: null }, error: null };
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { data: { session: null }, error: await response.json() };
    }

    const user = await response.json();
    return { 
      data: { 
        session: { user, access_token: token } 
      }, 
      error: null 
    };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Simple polling implementation for auth state changes
    let lastToken = getAuthToken();
    
    const interval = setInterval(() => {
      const currentToken = getAuthToken();
      if (currentToken !== lastToken) {
        lastToken = currentToken;
        if (currentToken === supabaseAnonKey) {
          callback('SIGNED_OUT', null);
        } else {
          callback('SIGNED_IN', { access_token: currentToken });
        }
      }
    }, 1000);

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval),
        },
      },
    };
  },
};

// Storage namespace for Supabase Storage API
export const supabaseStorage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          return { data: null, error };
        }

        const data = await response.json();
        return { data, error: null };
      },

      async remove(paths: string[]) {
        const token = getAuthToken();
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucket}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefixes: paths }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          return { data: null, error };
        }

        return { data: {}, error: null };
      },

      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
          },
        };
      },
    };
  },
};
