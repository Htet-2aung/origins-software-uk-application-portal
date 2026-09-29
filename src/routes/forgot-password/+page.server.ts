import { fail } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!email) return fail(400, { error: 'Enter your email address.', email });

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/auth/reset`
    });
    if (error) return fail(400, { error: error.message, email });
    return { success: true };
  }
};
