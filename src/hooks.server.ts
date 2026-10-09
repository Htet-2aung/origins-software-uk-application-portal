import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        name: 'origins-talent-auth',
        sameSite: 'lax',
        secure: event.url.protocol === 'https:',
        path: '/'
      },
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            event.cookies.set(name, value, { ...options, path: '/' });
          }
        }
      }
    }
  );

  const {
    data: { user },
    error
  } = await event.locals.supabase.auth.getUser();

  if (error) {
    // Invalid/expired sessions are treated as signed out. Do not allow a
    // stale refresh token to crash SSR.
    event.locals.user = null;
  } else {
    event.locals.user = user;
  }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};
