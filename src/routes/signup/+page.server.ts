import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();

    const fullName = String(form.get('fullName') ?? '')
      .trim()
      .replace(/\s+/g, ' ');

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(form.get('password') ?? '');
    const accountType = String(form.get('accountType') ?? 'applicant');
    const hrCode = String(form.get('hrCode') ?? '').trim();

    const isApplicant = accountType === 'applicant';
    const isHr = accountType === 'hr';

    if (!isApplicant && !isHr) {
      return fail(400, {
        error: 'Choose a valid account type.',
        fullName,
        email,
        accountType: 'applicant'
      });
    }

    if (!fullName || !email || !password) {
      return fail(400, {
        error: 'Complete all required fields.',
        fullName,
        email,
        accountType
      });
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return fail(400, {
        error: 'Enter a valid full name.',
        fullName,
        email,
        accountType
      });
    }

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return fail(400, {
        error: 'Enter a valid email address.',
        fullName,
        email,
        accountType
      });
    }

    if (password.length < 8 || password.length > 128) {
      return fail(400, {
        error: 'Password must be between 8 and 128 characters.',
        fullName,
        email,
        accountType
      });
    }

    if (isHr && (!env.HR_SIGNUP_CODE || hrCode !== env.HR_SIGNUP_CODE)) {
      return fail(403, {
        error: 'HR accounts require a valid invitation code.',
        fullName,
        email,
        accountType
      });
    }

    const origin = new URL(request.url).origin;

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${origin}/auth/callback`
      }
    });

    if (error) {
      console.error('Supabase signup failed', {
        message: error.message,
        code: error.code
      });

      return fail(400, {
        error: error.message,
        fullName,
        email,
        accountType
      });
    }

    if (!data.user) {
      return fail(500, {
        error: 'The account could not be created. Please try again.',
        fullName,
        email,
        accountType
      });
    }

    /*
     * The Supabase database trigger creates the base profile.
     * Every new account starts as "applicant".
     *
     * HR elevation happens only on the trusted server after
     * the HR invitation code has already been validated.
     */
    try {
      if (isHr) {
        const updated = await db
          .update(profiles)
          .set({
            fullName,
            email,
            role: 'recruiter'
          })
          .where(eq(profiles.id, data.user.id))
          .returning({
            id: profiles.id
          });

        if (updated.length !== 1) {
          throw new Error(
            'Profile trigger did not create the new user profile.'
          );
        }
      } else {
        const [profile] = await db
          .select({
            id: profiles.id
          })
          .from(profiles)
          .where(eq(profiles.id, data.user.id))
          .limit(1);

        if (!profile) {
          throw new Error(
            'Profile trigger did not create the new user profile.'
          );
        }
      }
    } catch (dbError) {
      console.error('Profile provisioning failed after signup', dbError);

      return fail(500, {
        error:
          'Your account was created, but its profile could not be provisioned. Please contact Origins support before trying again.',
        fullName,
        email,
        accountType
      });
    }

    /*
     * With email confirmation enabled, Supabase intentionally returns
     * no session. Send the user to sign-in with a clear message.
     */
    if (!data.session) {
      throw redirect(
        303,
        `/login?created=1&email=${encodeURIComponent(email)}`
      );
    }

    /*
     * If email confirmation is disabled, Supabase gives us a session
     * immediately and the user can enter the portal.
     */
    throw redirect(303, '/');
  }
};