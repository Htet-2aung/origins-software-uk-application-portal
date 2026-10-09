import { fail, redirect } from '@sveltejs/kit';

export const load = ({ url }) => ({
  created: url.searchParams.get('created') === '1',
  email: url.searchParams.get('email') ?? ''
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.', email });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Supabase sign-in failed', { message: error.message, code: error.code });
      return fail(400, { error: 'The email or password is incorrect, or the account has not been verified.', email });
    }

    throw redirect(303, '/');
  }
};
