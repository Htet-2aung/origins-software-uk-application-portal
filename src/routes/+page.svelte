<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  import Icon from '$lib/Icon.svelte';

  export let data: PageData;
  export let form: ActionData | null = null;

  type Job = PageData['openJobs'][number];
  type Application = PageData['applications'][number];

  const HR_ROLES = ['owner', 'admin', 'recruiter', 'hiring_manager'] as const;
  const isHr = HR_ROLES.includes(data.role as (typeof HR_ROLES)[number]);

  let active = isHr ? 'pipeline' : 'applications';
  let selectedJob: Job | null = null;
  let selectedApplication: Application | null = null;
  let toast = '';
  let dark = true;

  $: if (form?.success || form?.message) {
    toast = form.message ?? 'Saved.';
  }

  $: if (form?.error) {
    toast = form.error;
  }

  function initials(name: string | null | undefined) {
    return (
      name
        ?.split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'O'
    );
  }

  function formatDate(value: string | Date | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value: string | Date | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function notify(message: string) {
    toast = message;
    window.setTimeout(() => {
      if (toast === message) toast = '';
    }, 3200);
  }

  function openApplication(application: Application) {
    selectedApplication = application;
  }

  function closeModals() {
    selectedJob = null;
    selectedApplication = null;
  }

  function toggleTheme() {
    dark = !dark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('origins-talent-theme', dark ? 'dark' : 'light');
  }

  if (typeof document !== 'undefined') {
    const savedTheme = localStorage.getItem('origins-talent-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') dark = savedTheme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }
</script>

<svelte:head>
  <title>Origins — Talent Workspace</title>
  <meta name="description" content="Secure Origins talent workspace." />
</svelte:head>

<div class="app origins-talent-app">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="Origins talent home">
      <img class="brand-logo" src="/images/origins-logo.png" alt="Origins" />
      <span><b>ORIGINS</b><small>TALENT</small></span>
    </a>

    <div class="account-context">
      <span class="eyebrow">SIGNED IN AS</span>
      <strong>{data.profile.fullName}</strong>
      <small>{data.profile.role.replace('_', ' ')}</small>
    </div>

    <nav aria-label="Talent workspace">
      <span class="nav-title">WORKSPACE</span>

      {#if isHr}
        <button class:active={active === 'pipeline'} type="button" onclick={() => (active = 'pipeline')}>
          <span class="nav-icon"><Icon name="users" size={16} /></span>Pipeline
        </button>
        <button class:active={active === 'jobs'} type="button" onclick={() => (active = 'jobs')}>
          <span class="nav-icon"><Icon name="briefcase" size={16} /></span>Jobs
        </button>
        <button class:active={active === 'interviews'} type="button" onclick={() => (active = 'interviews')}>
          <span class="nav-icon"><Icon name="calendar" size={16} /></span>Interviews
        </button>
        <button class:active={active === 'messages'} type="button" onclick={() => (active = 'messages')}>
          <span class="nav-icon"><Icon name="message" size={16} /></span>Messages
        </button>
      {:else}
        <button class:active={active === 'applications'} type="button" onclick={() => (active = 'applications')}>
          <span class="nav-icon"><Icon name="file" size={16} /></span>My applications
        </button>
        <button class:active={active === 'jobs'} type="button" onclick={() => (active = 'jobs')}>
          <span class="nav-icon"><Icon name="briefcase" size={16} /></span>Open positions
        </button>
        <button class:active={active === 'interviews'} type="button" onclick={() => (active = 'interviews')}>
          <span class="nav-icon"><Icon name="calendar" size={16} /></span>Interviews
        </button>
        <button class:active={active === 'messages'} type="button" onclick={() => (active = 'messages')}>
          <span class="nav-icon"><Icon name="message" size={16} /></span>Messages
        </button>
      {/if}

      <span class="nav-title second">ACCOUNT</span>
      <button class:active={active === 'settings'} type="button" onclick={() => (active = 'settings')}>
        <span class="nav-icon"><Icon name="settings" size={16} /></span>Settings
      </button>
    </nav>

    <div class="side-bottom">
      <div class="live-state">
        <i></i>
        <div><b>SUPABASE CONNECTED</b><small>Authenticated production data</small></div>
      </div>

      <div class="account">
        <span>{initials(data.profile.fullName)}</span>
        <div><b>{data.profile.fullName}</b><small>{data.profile.email}</small></div>
        <form method="POST" action="?/logout">
          <button type="submit" aria-label="Sign out" title="Sign out">
            <Icon name="logout" size={15} />
          </button>
        </form>
      </div>
    </div>
  </aside>

  <main>
    <header class="topbar">
      <div class="crumb">
        <span>ORIGINS</span><strong>·</strong><strong>{isHr ? 'Talent workspace' : 'Applicant workspace'}</strong>
      </div>
      <div class="top-actions">
        <button class="top-icon" type="button" aria-label="Toggle theme" onclick={toggleTheme}>
          <Icon name={dark ? 'sun' : 'moon'} size={15} />
        </button>
        <span class="role-pill">{data.profile.role.replace('_', ' ')}</span>
        <span class="avatar">{initials(data.profile.fullName)}</span>
      </div>
    </header>

    {#if isHr && active === 'pipeline'}
      <div class="content">
        <div class="head">
          <div>
            <span class="eyebrow green">RECRUITING</span>
            <h1>Hiring pipeline.</h1>
            <p>Review authenticated candidate applications and move them through your real hiring workflow.</p>
          </div>
          <button class="button primary" type="button" onclick={() => (active = 'jobs')}>Manage jobs <Icon name="arrow" size={13} /></button>
        </div>

        <section class="metrics">
          <article><span>APPLICATIONS</span><strong>{data.stats.applications}</strong><small>Real application records</small></article>
          <article><span>APPLICANTS</span><strong>{data.stats.applicants}</strong><small>Unique applicant profiles</small></article>
          <article><span>INTERVIEWS</span><strong>{data.stats.interviews}</strong><small>Not cancelled</small></article>
          <article><span>OPEN JOBS</span><strong>{data.stats.openJobs}</strong><small>Currently published</small></article>
        </section>

        {#if data.applications.length === 0}
          <section class="empty panel">
            <span class="eyebrow">PIPELINE EMPTY</span>
            <h2>No applications yet.</h2>
            <p>Applications submitted through the portal will appear here automatically.</p>
            <button class="button primary" type="button" onclick={() => (active = 'jobs')}>View jobs</button>
          </section>
        {:else}
          <section class="panel table-panel">
            <div class="panel-head">
              <div><span class="eyebrow">LIVE RECORDS</span><h2>Applications</h2></div>
              <span class="count">{data.applications.length}</span>
            </div>
            <div class="table">
              <div class="tr th"><span>Candidate</span><span>Position</span><span>Status</span><span>Updated</span><span></span></div>
              {#each data.applications as application}
                <div class="tr candidate">
                  <span class="person">
                    <i>{initials(application.applicant?.fullName)}</i>
                    <b>{application.applicant?.fullName ?? 'Unknown applicant'}<small>{application.applicant?.email ?? '—'}</small></b>
                  </span>
                  <span>{application.job?.title ?? 'Position removed'}</span>
                  <span><em class="status {application.status}">{application.status}</em></span>
                  <span>{formatDate(application.updatedAt)}</span>
                  <button class="more" type="button" aria-label="Open application" onclick={() => openApplication(application)}><Icon name="external" size={14} /></button>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {:else if active === 'jobs'}
      <div class="content">
        <div class="head">
          <div>
            <span class="eyebrow green">{isHr ? 'HIRING' : 'CAREERS'}</span>
            <h1>{isHr ? 'Your positions.' : 'Open positions.'}</h1>
            <p>{isHr ? 'Publish and review real positions.' : 'Explore positions currently published by Origins.'}</p>
          </div>
        </div>

        {#if data.openJobs.length === 0}
          <section class="empty panel">
            <span class="eyebrow">NO OPEN POSITIONS</span>
            <h2>There are no open jobs right now.</h2>
            <p>New positions will appear here when an authorised HR user publishes them.</p>
          </section>
        {:else}
          <section class="job-grid">
  {#each data.openJobs as job}
    <article class="job-card">
      <div class="job-top">
        <span class="status open">OPEN</span>
        <span>{job.employmentType}</span>
      </div>

      <h2>{job.title}</h2>

      <p>{job.department} · {job.location}</p>

      <p class="job-summary">
        {job.description.length > 150
          ? `${job.description.slice(0, 150)}…`
          : job.description}
      </p>

      <small>Published {formatDate(job.createdAt)}</small>

      {#if isHr}
        <button
          class="button quiet full"
          type="button"
          onclick={() => (active = 'pipeline')}
        >
          Open pipeline
          <Icon name="arrow" size={13} />
        </button>
      {:else}
        <button
          class="button primary full"
          type="button"
          onclick={() => (selectedJob = job)}
        >
          View job
          <Icon name="arrow" size={13} />
        </button>
      {/if}
    </article>
  {/each}
</section>

        {/if}

        {#if isHr}
          <section class="panel create-job">
            <div><span class="eyebrow">NEW POSITION</span><h2>Publish a job</h2><p>Create a real job record. Published positions become available to applicants.</p></div>
            <form method="POST" action="?/createJob" use:enhance>
              <div class="form-grid">
                <input name="title" placeholder="Job title" maxlength="160" required />
                <input name="department" placeholder="Department" maxlength="160" required />
                <input name="location" placeholder="Location" maxlength="160" required />
                <input name="employmentType" placeholder="Full-time / Contract" maxlength="160" required />
              </div>
              <textarea name="description" placeholder="Job description" maxlength="30000" required></textarea>
              <button class="button primary" type="submit">Publish job</button>
            </form>
          </section>
        {/if}
      </div>
    {:else if !isHr && active === 'applications'}
      <div class="content">
        <div class="head">
          <div><span class="eyebrow green">YOUR ACCOUNT</span><h1>Your applications.</h1><p>Only records belonging to your authenticated applicant account are shown.</p></div>
        </div>

        {#if data.applications.length === 0}
          <section class="empty panel">
            <span class="eyebrow">NO APPLICATIONS</span>
            <h2>Your workspace is ready.</h2>
            <p>You have not submitted an application yet. New applicant accounts start with an empty workspace.</p>
            <button class="button primary" type="button" onclick={() => (active = 'jobs')}>Browse open positions <Icon name="arrow" size={13} /></button>
          </section>
        {:else}
          <section class="application-list">
            {#each data.applications as application}
              <article class="panel application-card">
                <div class="app-main"><span class="eyebrow">APPLICATION</span><h2>{application.job?.title ?? 'Position'}</h2><p>{application.job?.department ?? '—'} · {application.job?.location ?? '—'}</p></div>
                <div><span class="status {application.status}">{application.status}</span><small>Updated {formatDate(application.updatedAt)}</small></div>
                <button class="button quiet" type="button" onclick={() => openApplication(application)}>Open <Icon name="external" size={13} /></button>
              </article>
            {/each}
          </section>
        {/if}
      </div>
    {:else if active === 'interviews'}
      <div class="content">
        <div class="head"><div><span class="eyebrow green">SCHEDULING</span><h1>Interviews.</h1><p>Access interview rooms attached to your authenticated application records.</p></div></div>
        {#if data.interviews.length === 0}
          <section class="empty panel"><span class="eyebrow">NO INTERVIEWS</span><h2>No interviews scheduled.</h2><p>When an interview is created for one of your applications, it will appear here.</p></section>
        {:else}
          <section class="panel">
            <div class="table">
              {#each data.interviews as interview}
                <div class="interview-row">
                  <div>
                    <span class="status {interview.status}">{interview.status}</span>
                    <h3>{interview.title}</h3>
                    <small>{interview.type} · {formatDateTime(interview.startsAt)} — {formatDateTime(interview.endsAt)}</small>
                  </div>
                  <a class="button quiet" href={`/interview/${interview.roomCode}`}>Open room</a>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {:else if active === 'messages'}
      <div class="content">
        <div class="head"><div><span class="eyebrow green">MESSAGES</span><h1>Application conversations.</h1><p>Messages are stored against real application records.</p></div></div>
        {#if data.messages.length === 0}
          <section class="empty panel"><span class="eyebrow">NO MESSAGES</span><h2>No conversation yet.</h2><p>{isHr ? 'Messages will appear when you communicate with an applicant.' : 'A recruiter can message you once your application is being reviewed.'}</p></section>
        {:else}
          <section class="message-list">
            {#each data.messages as message}
              <article class="panel message-card">
                <span class="eyebrow">{formatDateTime(message.createdAt)}</span>
                <p>{message.body}</p>
              </article>
            {/each}
          </section>
        {/if}

        {#if selectedApplication}
          <section class="panel compose-panel">
            <span class="eyebrow">APPLICATION MESSAGE</span>
            <h2>{selectedApplication.job?.title ?? 'Application'}</h2>
            <form method="POST" action="?/sendMessage" use:enhance>
              <input type="hidden" name="applicationId" value={selectedApplication.id} />
              <label for="message-body">Message</label>
              <textarea id="message-body" name="body" placeholder="Write a message…" maxlength="10000" required></textarea>
              <button class="button primary" type="submit">Send message</button>
            </form>
          </section>
        {/if}
      </div>
    {:else if active === 'settings'}
      <div class="content">
        <div class="head"><div><span class="eyebrow green">ACCOUNT</span><h1>Settings.</h1><p>Your identity and access are controlled by your authenticated Supabase account.</p></div></div>
        <section class="settings-grid">
          <article class="panel">
            <span class="eyebrow">PROFILE</span>
            <h2>{data.profile.fullName}</h2>
            <p>{data.profile.email}</p>
            <div class="setting-row"><span>Role</span><strong>{data.profile.role.replace('_', ' ')}</strong></div>
            <div class="setting-row"><span>Account created</span><strong>{formatDate(data.profile.createdAt)}</strong></div>
          </article>
          <article class="panel">
            <span class="eyebrow">ACCESS</span>
            <h2>Authenticated workspace</h2>
            <p>You cannot switch between HR and applicant workspaces. Your authenticated profile determines which workspace and records you can access.</p>
            <form method="POST" action="?/logout"><button class="button quiet" type="submit">Sign out</button></form>
          </article>
        </section>
      </div>
    {/if}
  </main>
</div>

{#if selectedJob && !isHr}
  <div class="modal-backdrop" role="presentation">
    <section
      class="modal job-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-modal-title"
    >
      <button
        class="modal-close"
        type="button"
        aria-label="Close"
        onclick={closeModals}
      >
        ×
      </button>

      <span class="eyebrow green">OPEN POSITION</span>

      <h2 id="job-modal-title">
        {selectedJob.title}
      </h2>

      <p class="modal-meta">
        {selectedJob.department}
        ·
        {selectedJob.location}
        ·
        {selectedJob.employmentType}
      </p>

      <div class="job-modal-description">
        <span class="eyebrow">JOB DESCRIPTION</span>

        <div class="description-scroll">
          {selectedJob.description}
        </div>
      </div>

      <form
        method="POST"
        action="?/apply"
        enctype="multipart/form-data"
        use:enhance
      >
        <input
          type="hidden"
          name="jobId"
          value={selectedJob.id}
        />

        <div class="apply-section">
          <span class="eyebrow">APPLY FOR THIS POSITION</span>

          <label for="cv-upload">
            CV / Resume
          </label>

          <input
            id="cv-upload"
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            required
          />

          <small class="upload-help">
            PDF, DOC or DOCX. Maximum file size: 10 MB.
          </small>

          <label for="cover-letter">
            Cover letter
          </label>

          <textarea
            id="cover-letter"
            name="coverLetter"
            maxlength="10000"
            placeholder="Tell Origins why this role is a good fit for you."
          ></textarea>

          <button
            class="button primary full"
            type="submit"
          >
            Submit application
          </button>
        </div>
      </form>
    </section>
  </div>
{/if}

{#if selectedApplication}
  <div class="modal-backdrop" role="presentation">
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
      <button class="modal-close" type="button" aria-label="Close" onclick={closeModals}>×</button>
      <span class="eyebrow green">APPLICATION</span>
      <h2 id="application-modal-title">{selectedApplication.job?.title ?? 'Application'}</h2>
      <p class="modal-meta">{selectedApplication.applicant?.fullName ?? data.profile.fullName} · {selectedApplication.status}</p>

      {#if isHr}
        <form method="POST" action="?/updateApplication" use:enhance>
          <input type="hidden" name="applicationId" value={selectedApplication.id} />
          <label for="application-status">Status</label>
          <select id="application-status" name="status" value={selectedApplication.status}>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="assessment">Assessment</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <label for="application-note">Internal note</label>
          <textarea id="application-note" name="note" maxlength="5000" placeholder="Optional internal note"></textarea>
          <button class="button primary full" type="submit">Update application</button>
        </form>
      {:else}
        <p>{selectedApplication.coverLetter || 'No cover letter was submitted.'}</p>
        <button class="button primary full" type="button" onclick={() => { selectedApplication = null; active = 'messages'; }}>Open messages</button>
      {/if}
    </section>
  </div>
{/if}

{#if toast}
  <div class="toast" role="status" aria-live="polite"><i></i>{toast}</div>
{/if}
