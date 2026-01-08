import { Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// You should set these in your environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Log the URL at startup to help diagnose DNS/env issues
console.log('[Socket.io auth] SUPABASE_URL:', SUPABASE_URL ? SUPABASE_URL : '(not set)');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function authenticateSocket(socket: Socket): Promise<{ userId: string, user: any } | null> {
  // Expect token in handshake auth
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
  if (!token) return null;

  // Remove 'Bearer ' if present
  const jwt = typeof token === 'string' && token.startsWith('Bearer ')
    ? token.slice(7)
    : token;

  // Validate JWT with Supabase (wrap in try/catch to capture network/DNS failures)
  try {
    const { data, error } = await supabase.auth.getUser(jwt);
    if (error || !data?.user) return null;
    return { userId: data.user.id, user: data.user };
  } catch (err) {
    console.error('[Socket.io auth] Error calling supabase.auth.getUser for socket', socket.id, 'SUPABASE_URL:', SUPABASE_URL, 'error:', err);
    // Return null so the caller treats this as an authentication failure.
    return null;
  }
}
