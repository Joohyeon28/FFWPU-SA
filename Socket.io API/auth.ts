import { Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// You should set these in your environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function authenticateSocket(socket: Socket): Promise<{ userId: string, user: any } | null> {
  // Expect token in handshake auth
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
  if (!token) return null;

  // Remove 'Bearer ' if present
  const jwt = typeof token === 'string' && token.startsWith('Bearer ')
    ? token.slice(7)
    : token;

  // Validate JWT with Supabase
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return { userId: data.user.id, user: data.user };
}
