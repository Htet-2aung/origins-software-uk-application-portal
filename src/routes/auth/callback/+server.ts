import { redirect } from '@sveltejs/kit';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export const GET = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Auth callback exchange failed', error);
      throw redirect(303, `/login?error=verification`);
    }
  }

  throw redirect(303, next);
};
