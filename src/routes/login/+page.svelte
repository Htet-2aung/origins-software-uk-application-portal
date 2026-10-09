<script lang="ts">
  import { enhance } from '$app/forms';
  export let form;
  export let data;
</script>

<svelte:head><title>Sign in — Origins Talent</title></svelte:head>

<div class="auth-shell">
  <div class="auth-glow"></div>

  <section class="auth-brand">
    <a href="/" class="brand">
      <img src="/images/origins-logo.png" alt="Origins" />
      <span>ORIGINS<small>TALENT</small></span>
    </a>

    <div class="brand-copy">
      <span>PRIVATE TALENT WORKSPACE</span>
      <h1>Hiring, without the noise.</h1>
      <p>A secure recruiting workspace for Origins teams and applicants.</p>
    </div>

    <div class="trust">Private · Authenticated · Role controlled</div>
  </section>

  <section class="auth-card">
    <span class="eyebrow">WELCOME BACK</span>
    <h2>Sign in</h2>
    <p class="sub">Use your Origins account to continue.</p>

    {#if data?.created}
      <div class="success" role="status">
        Account created. Check your email to verify the account before signing in.
      </div>
    {/if}

    {#if form?.error}
      <div class="error" role="alert">{form.error}</div>
    {/if}

    <form method="POST" use:enhance>
      <label for="login-email">
        Email
        <input id="login-email" name="email" type="email" autocomplete="email" required value={form?.email ?? data?.email ?? ''} />
      </label>

      <label for="login-password">
        Password
        <input id="login-password" name="password" type="password" autocomplete="current-password" required />
      </label>

      <button class="primary" type="submit">Sign in</button>
    </form>

    <div class="links">
      <a href="/forgot-password">Forgot password?</a>
      <a href="/signup">Create an account</a>
    </div>

    <a class="back" href="https://origins-software.com">Origins website</a>
  </section>
</div>
