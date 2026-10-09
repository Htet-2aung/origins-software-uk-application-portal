import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
};

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    const form = await request.formData();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });
    if (password !== confirmation) return fail(400, { error: 'Passwords do not match.' });
    const { error } = await locals.supabase.auth.updateUser({ password });
    if (error) return fail(400, { error: error.message });
    throw redirect(303, '/');
  }
};
