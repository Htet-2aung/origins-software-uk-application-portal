<script lang="ts">
  export let data;
</script>

<svelte:head>
  <title>{data.interview.title} · Origins Interview</title>
  <meta name="description" content="Interview details and Google Meet access." />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="page-shell">
  <section class="meeting-card">
    <a class="brand" href="/">ORIGINS <span>/ TALENT</span></a>
    <div class="icon">↗</div>
    <p class="eyebrow">SCHEDULED INTERVIEW</p>
    <h1>{data.interview.title}</h1>
    <p class="role">{data.job?.title ?? 'Candidate interview'}</p>
    <div class="details">
      <div><span>DATE & TIME</span><strong>{new Date(data.interview.startsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>
      <div><span>INTERVIEWER</span><strong>{data.interviewer?.fullName ?? 'Hiring team'}</strong></div>
      <div><span>FORMAT</span><strong>{data.interview.type === 'video' ? 'Google Meet' : data.interview.type}</strong></div>
    </div>
    {#if data.interview.meetingUrl}
      <a class="join-button" href={data.interview.meetingUrl} target="_blank" rel="noopener noreferrer">Join Google Meet <span>↗</span></a>
      <p class="hint">Google Meet opens in a new tab. Allow camera and microphone access there if prompted.</p>
    {:else}
      <div class="missing-link"><strong>Google Meet link not available yet</strong><p>HR has not added the meeting link to this interview. Please contact the hiring team; this page will not open an internal video room.</p></div>
    {/if}
    <a class="back-link" href="/">← Back to your portal</a>
  </section>
</main>

<style>
  :global(body){margin:0;background:#f5f7f5;color:#17231c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page-shell{min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}.meeting-card{width:min(100%,520px);box-sizing:border-box;background:#fff;border:1px solid #e1e9e2;border-radius:24px;padding:34px;box-shadow:0 20px 60px #17231c0b}.brand{color:#173d29;font-size:13px;font-weight:850;letter-spacing:.14em;text-decoration:none}.brand span{color:#7d8b81;font-weight:500}.icon{margin-top:34px;width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:#eaf7ee;color:#20844b;font-size:25px}.eyebrow{margin:24px 0 8px;color:#28804a;font-size:10px;font-weight:800;letter-spacing:.17em}h1{margin:0;font-size:30px;letter-spacing:-.04em;line-height:1.2}.role{color:#738077;margin:9px 0 25px}.details{border-top:1px solid #edf0ed;border-bottom:1px solid #edf0ed;padding:8px 0;margin-bottom:24px}.details>div{display:flex;flex-direction:column;gap:6px;padding:13px 0}.details span{font-size:9px;letter-spacing:.12em;color:#849087;font-weight:800}.details strong{font-size:13px;font-weight:650}.join-button{display:flex;justify-content:center;align-items:center;gap:12px;background:#176b3a;color:white;padding:15px 18px;border-radius:12px;text-decoration:none;font-weight:750;font-size:14px}.join-button:hover{background:#12582f}.hint{font-size:12px;line-height:1.6;color:#7a867d;text-align:center;margin:12px 0 0}.missing-link{background:#fff8e8;border:1px solid #f1dfb2;border-radius:12px;padding:16px}.missing-link strong{font-size:13px}.missing-link p{font-size:12px;line-height:1.6;color:#74664a;margin:7px 0 0}.back-link{display:inline-block;margin-top:24px;color:#58675c;text-decoration:none;font-size:12px;font-weight:650}.back-link:hover{text-decoration:underline}@media(max-width:480px){.meeting-card{padding:25px 21px;border-radius:18px}h1{font-size:25px}}
</style>
