<script lang="ts">
  import { enhance } from '$app/forms';
  export let form;
  let accountType = 'applicant';
</script>

<svelte:head><title>Create account — Origins Talent</title></svelte:head>

<div class="auth-shell">
  <div class="auth-glow"></div>

  <section class="auth-brand">
    <a href="/" class="brand">
      <img src="/images/origins-logo.png" alt="Origins" />
      <span>ORIGINS<small>TALENT</small></span>
    </a>

    <div class="brand-copy">
      <span>SECURE TALENT ACCESS</span>
      <h1>One identity. The right workspace.</h1>
      <p>Applicants see their own applications. HR sees the recruiting workspace assigned to their authenticated role.</p>
    </div>

    <div class="trust">No demo records · No role switching · Supabase Auth</div>
  </section>

  <section class="auth-card">
    <span class="eyebrow">CREATE ACCOUNT</span>
    <h2>Get started</h2>
    <p class="sub">Create the account you actually need.</p>

    {#if form?.error}
      <div class="error" role="alert">{form.error}</div>
    {/if}

    <form method="POST" use:enhance>
      <div class="account-types" aria-label="Account type">
        <button type="button" class:chosen={accountType === 'applicant'} onclick={() => accountType = 'applicant'}>
          <b>Applicant</b>
          <small>Track applications and interviews</small>
        </button>

        <button type="button" class:chosen={accountType === 'hr'} onclick={() => accountType = 'hr'}>
          <b>HR / Recruiter</b>
          <small>Manage candidates and hiring</small>
        </button>
      </div>

      <input type="hidden" name="accountType" value={accountType} />

      <label for="signup-name">
        Full name
        <input id="signup-name" name="fullName" autocomplete="name" required value={form?.fullName ?? ''} />
      </label>

      <label for="signup-email">
        Email
        <input id="signup-email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
      </label>

      <label for="signup-password">
        Password
        <input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
      </label>

      {#if accountType === 'hr'}
        <label for="signup-hr-code">
          HR invitation code
          <input id="signup-hr-code" name="hrCode" type="password" autocomplete="off" required />
        </label>
        <p class="hint">HR access is invitation-only. The invitation code is never stored in the browser.</p>
      {/if}

      <button class="primary" type="submit">Create {accountType === 'hr' ? 'HR' : 'applicant'} account</button>
    </form>

    <div class="links">
      <span>Already have an account?</span>
      <a href="/login">Sign in</a>
    </div>
  </section>
</div>
