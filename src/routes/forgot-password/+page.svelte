<script lang="ts">
  import { enhance } from '$app/forms';
  export let form;
</script>
<svelte:head><title>Reset password — Origins Talent</title></svelte:head>
<div class="auth-shell"><div class="auth-glow"></div><section class="auth-brand"><a href="/" class="brand"><img src="/images/origins-logo.png" alt="Origins" /><span>ORIGINS<small>TALENT</small></span></a><div class="brand-copy"><span>ACCOUNT RECOVERY</span><h1>Get back into your workspace.</h1><p>We’ll send a secure password reset link to the email attached to your account.</p></div></section><section class="auth-card"><span class="eyebrow">PASSWORD RESET</span><h2>Forgot password?</h2><p class="sub">Enter your account email.</p>{#if form?.error}<div class="error">{form.error}</div>{/if}{#if form?.success}<div class="success">If an account exists for that address, a reset link has been sent.</div>{/if}<form method="POST" use:enhance><label>Email<input name="email" type="email" autocomplete="email" required /></label><button class="primary" type="submit">Send reset link</button></form><div class="links"><a href="/login">Back to sign in</a></div></section></div>
