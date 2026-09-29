<script lang="ts">
  import { enhance } from '$app/forms';
  export let form;
</script>
<svelte:head><title>Choose a new password — Origins Talent</title></svelte:head>
<div class="auth-shell"><div class="auth-glow"></div><section class="auth-brand"><a href="/" class="brand"><img src="/images/origins-logo.png" alt="Origins" /><span>ORIGINS<small>TALENT</small></span></a><div class="brand-copy"><span>SECURE ACCOUNT</span><h1>A new password, then you’re back.</h1><p>Choose a strong password for your Origins account.</p></div></section><section class="auth-card"><span class="eyebrow">PASSWORD</span><h2>Set new password</h2>{#if form?.error}<div class="error">{form.error}</div>{/if}<form method="POST" use:enhance><label>New password<input name="password" type="password" minlength="8" autocomplete="new-password" required /></label><label>Confirm password<input name="confirmation" type="password" minlength="8" autocomplete="new-password" required /></label><button class="primary" type="submit">Update password</button></form></section></div>
