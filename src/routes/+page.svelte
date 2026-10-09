<!--
   Disclaimer: Property of origins ltd. united kingdom.
   privacy policy: https://www.origins-software.com/privacy
   terms of service: https://www.origins-software.com/terms
-->
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
  let applicationSearch = '';
  let statusFilter = 'all';
  let busyAction = false;
  const statusStages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn'];
  $: filteredApplications = data.applications.filter((application) => {
    const haystack = `${application.applicant?.fullName ?? ''} ${application.applicant?.email ?? ''} ${application.job?.title ?? ''}`.toLowerCase();
    return haystack.includes(applicationSearch.toLowerCase()) && (statusFilter === 'all' || application.status === statusFilter);
  });
  $: stageCounts = statusStages.map((status) => ({ status, count: data.applications.filter((application) => application.status === status).length }));
  $: maxStageCount = Math.max(1, ...stageCounts.map((stage) => stage.count));
  $: upcomingInterviews = (data.interviews ?? []).filter((item) => new Date(item.startsAt).getTime() >= Date.now() && item.status !== 'cancelled').slice(0, 5);
  $: selectedApplicationInterviews = selectedApplication ? data.interviews.filter((item) => item.applicationId === selectedApplication?.id) : [];

  function enhanceWithLoading() {
    busyAction = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      try { await update(); } finally { busyAction = false; }
    };
  }
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  $: calendarTitle = calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  $: calendarCells = buildCalendar(calendarMonth, data.interviews ?? []);

  function buildCalendar(month: Date, interviews: PageData['interviews']) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const previousMonthDays = new Date(year, monthIndex, 0).getDate();
    const today = new Date();
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      const date = new Date(year, monthIndex, dayNumber);
      const inMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const day = inMonth ? dayNumber : dayNumber <= 0 ? previousMonthDays + dayNumber : dayNumber - daysInMonth;
      const events = interviews.filter((item) => {
        const startsAt = new Date(item.startsAt);
        return !Number.isNaN(startsAt.getTime()) && startsAt.getFullYear() === date.getFullYear() && startsAt.getMonth() === date.getMonth() && startsAt.getDate() === date.getDate() && item.status !== 'cancelled';
      });
      return { key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`, day, inMonth, today: date.toDateString() === today.toDateString(), events };
    });
  }

  function shiftCalendar(offset: number) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  }

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

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = 'dark';
    localStorage.removeItem('origins-talent-theme');
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

        <section class="metrics hr-metrics">
          <article><span>TOTAL APPLICATIONS</span><strong>{data.stats.applications}</strong><small>Across all published positions</small></article>
          <article><span>ACTIVE CANDIDATES</span><strong>{data.stats.active}</strong><small>In review or progressing</small></article>
          <article><span>UPCOMING INTERVIEWS</span><strong>{upcomingInterviews.length}</strong><small>Scheduled from saved records</small></article>
          <article><span>OPEN POSITIONS</span><strong>{data.stats.openJobs}</strong><small>{data.stats.offers} offer-stage candidate(s)</small></article>
        </section>

        <section class="hr-analytics">
          <article class="panel analytics-panel">
            <div class="panel-head"><div><span class="eyebrow">HIRING ANALYTICS</span><h2>Application stages</h2><p>Live distribution of your current application records.</p></div><span class="analytics-total">{data.stats.applications} total</span></div>
            {#if data.applications.length === 0}<div class="chart-empty">Stage analytics will appear when candidates apply.</div>{:else}
              <div class="stage-chart" role="img" aria-label="Application counts by hiring stage">
                {#each stageCounts as stage}
                  <div class="stage-bar-row"><span>{stage.status.replace('_', ' ')}</span><div class="stage-track"><i style={`width:${(stage.count / maxStageCount) * 100}%`}></i></div><b>{stage.count}</b></div>
                {/each}
              </div>
            {/if}
          </article>
          <article class="panel upcoming-panel">
            <div class="panel-head"><div><span class="eyebrow">NEXT UP</span><h2>Interview schedule</h2><p>Upcoming booked interviews.</p></div><button class="text-btn" type="button" onclick={() => (active = 'interviews')}>View calendar →</button></div>
            {#if upcomingInterviews.length === 0}<div class="chart-empty">No upcoming interviews scheduled.</div>{:else}
              {#each upcomingInterviews as interview}
                {@const related = data.applications.find((item) => item.id === interview.applicationId)}
                <div class="upcoming-item"><div class="upcoming-date"><b>{new Date(interview.startsAt).toLocaleDateString('en-GB',{day:'2-digit'})}</b><small>{new Date(interview.startsAt).toLocaleDateString('en-GB',{month:'short'})}</small></div><div class="upcoming-copy"><strong>{interview.title}</strong><small>{related?.applicant?.fullName ?? 'Candidate'} · {related?.job?.title ?? 'Position'}</small><small>{formatDateTime(interview.startsAt)}</small></div><a class="mini-link" href={interview.meetingUrl || `/interview/${interview.roomCode}`} target={interview.meetingUrl ? '_blank' : undefined} rel={interview.meetingUrl ? 'noopener noreferrer' : undefined} aria-label="Open Google Meet interview">↗</a></div>
              {/each}
            {/if}
          </article>
        </section>

        <section class="panel table-panel hr-applications-panel">
          <div class="panel-head"><div><span class="eyebrow">CANDIDATE TRACKING</span><h2>Applications</h2><p>Search candidates, track each position, and open a full application record.</p></div><span class="count">{filteredApplications.length} / {data.applications.length}</span></div>
          <div class="application-filters"><label class="search-field"><Icon name="search" size={15}/><input bind:value={applicationSearch} placeholder="Search candidate, email or position" aria-label="Search applications" /></label><select bind:value={statusFilter} aria-label="Filter by application status"><option value="all">All stages</option>{#each statusStages as status}<option value={status}>{status.charAt(0).toUpperCase()+status.slice(1)}</option>{/each}</select></div>
          {#if filteredApplications.length === 0}<div class="chart-empty">{data.applications.length ? 'No applications match your search and filters.' : 'Applications submitted through the portal will appear here automatically.'}</div>{:else}
            <div class="table hr-table"><div class="tr th"><span>Candidate</span><span>Position</span><span>Stage</span><span>Last updated</span><span>Details</span></div>
              {#each filteredApplications as application}
                <div class="tr candidate hr-candidate-row"><span class="person"><i>{initials(application.applicant?.fullName)}</i><b>{application.applicant?.fullName ?? 'Unknown applicant'}<small>{application.applicant?.email ?? '—'}</small></b></span><span class="position-cell">{application.job?.title ?? 'Position removed'}<small>{application.job?.department ?? 'Department not set'}</small></span><span><em class="status {application.status}">{application.status}</em></span><span>{formatDate(application.updatedAt)}</span><button class="button quiet details-button" type="button" onclick={() => openApplication(application)}>Details <Icon name="external" size={13}/></button></div>
              {/each}
            </div>
          {/if}
        </section>
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
        <div class="head"><div><span class="eyebrow green">SCHEDULING</span><h1>Interviews.</h1><p>Join scheduled interviews using the Google Meet link supplied by HR.</p></div></div>
        {#if isHr}
          <section class="panel schedule-panel"><div class="panel-head"><div><span class="eyebrow">BOOK AN INTERVIEW</span><h2>Schedule for an applicant</h2><p>Add the Google Meet URL created by HR and attach it to the applicant’s schedule.</p></div></div>
            <form method="POST" action="?/scheduleInterview" use:enhance={enhanceWithLoading}>
              <div class="schedule-grid"><label>Application<select name="applicationId" required><option value="">Choose candidate and position</option>{#each data.applications as application}<option value={application.id}>{application.applicant?.fullName ?? 'Candidate'} — {application.job?.title ?? 'Position'} ({application.status})</option>{/each}</select></label><label>Interview title<input name="title" placeholder="e.g. Technical interview" maxlength="160" required /></label><label>Format<select name="type"><option value="video">Google Meet</option><option value="phone">Phone</option><option value="onsite">On-site</option></select></label><label class="meeting-link-field">Google Meet link<input name="meetingUrl" type="url" placeholder="https://meet.google.com/abc-defg-hij" pattern="https://meet\.google\.com/.*" /><small>Paste the meeting URL created by HR. Required for Google Meet interviews.</small></label><label>Starts at<input name="startsAt" type="datetime-local" required /></label><label>Ends at<input name="endsAt" type="datetime-local" required /></label></div>
              <button class="button primary" type="submit" disabled={busyAction}>{#if busyAction}<span class="loading-spinner" aria-hidden="true"></span> Scheduling…{:else}Schedule interview <Icon name="arrow" size={13}/>{/if}</button>
            </form>
          </section>
        {/if}
        <section class="interview-calendar panel">
          <div class="calendar-toolbar">
            <div><span class="eyebrow">SCHEDULE OVERVIEW</span><h2>{calendarTitle}</h2><p>Interview dates sync from your saved application records.</p></div>
            <div class="calendar-controls"><button type="button" aria-label="Previous month" onclick={() => shiftCalendar(-1)}>‹</button><button type="button" class="today-button" onclick={() => (calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button><button type="button" aria-label="Next month" onclick={() => shiftCalendar(1)}>›</button></div>
          </div>
          <div class="calendar-grid calendar-weekdays">{#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as weekday}<div>{weekday}</div>{/each}</div>
          <div class="calendar-grid calendar-days">{#each calendarCells as cell (cell.key)}<div class:outside={!cell.inMonth} class:today={cell.today} class="calendar-day"><span class="day-number">{cell.day}</span>{#each cell.events.slice(0, 2) as event}<a class="calendar-event" href={event.meetingUrl || `/interview/${event.roomCode}`} target={event.meetingUrl ? '_blank' : undefined} rel={event.meetingUrl ? 'noopener noreferrer' : undefined} title={`${event.title} · ${formatDateTime(event.startsAt)}`}>{event.title}</a>{/each}{#if cell.events.length > 2}<span class="more-events">+{cell.events.length - 2} more</span>{/if}</div>{/each}</div>
          <div class="calendar-legend"><span><i></i> Scheduled interview</span><span>{data.interviews.filter((item) => item.status !== 'cancelled').length} active interviews</span></div>
        </section>
        {#if data.interviews.length === 0}
          <section class="empty panel"><span class="eyebrow">NO INTERVIEWS</span><h2>No interviews scheduled.</h2><p>When an interview is created for one of your applications, it will appear here automatically.</p></section>
        {:else}
          <section class="panel interview-list-panel">
            <div class="table">
              {#each data.interviews as interview}
                <div class="interview-row">
                  <div>
                    <span class="status {interview.status}">{interview.status}</span>
                    <h3>{interview.title}</h3>
                    <small>{interview.type} · {formatDateTime(interview.startsAt)} — {formatDateTime(interview.endsAt)}</small>
                  </div>
                  <a class="button quiet" href={interview.meetingUrl || `/interview/${interview.roomCode}`} target={interview.meetingUrl ? '_blank' : undefined} rel={interview.meetingUrl ? 'noopener noreferrer' : undefined}>{interview.meetingUrl ? 'Join Google Meet' : 'Meeting link missing'}</a>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
       {:else if active === 'messages'}
      <div class="content">
        <div class="head">
          <div>
            <span class="eyebrow green">MESSAGES</span>
            <h1>Application conversations.</h1>
            <p>Messages are stored against real application records.</p>
          </div>
        </div>

        {#if data.messages.length === 0}
          <section class="empty panel">
            <span class="eyebrow">NO MESSAGES</span>
            <h2>No conversation yet.</h2>
            <p>
              {isHr
                ? 'Messages will appear when you communicate with an applicant.'
                : 'A recruiter can message you once your application is being reviewed.'}
            </p>
          </section>
        {:else}
          <section class="message-list">
            {#each data.messages as message}
              <article class="panel message-card">
                <span class="eyebrow">
                  {formatDateTime(message.createdAt)}
                </span>
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
              <input
                type="hidden"
                name="applicationId"
                value={selectedApplication.id}
              />
              <label for="message-body">Message</label>
              <textarea
                id="message-body"
                name="body"
                placeholder="Write a message…"
                maxlength="10000"
                required
              ></textarea>
              <button class="button primary" type="submit">
                Send message
              </button>
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
  <div class="brand-watermark" aria-hidden="true">ORIGINS SOFTWARE · UNITED KINGDOM</div>
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
        <div class="candidate-detail-summary"><div><small>Candidate email</small><strong>{selectedApplication.applicant?.email ?? 'Not available'}</strong></div><div><small>Position</small><strong>{selectedApplication.job?.title ?? 'Position removed'}</strong></div><div><small>Department</small><strong>{selectedApplication.job?.department ?? '—'}</strong></div></div>
        <div class="candidate-cover-letter"><span class="eyebrow">COVER LETTER</span><p>{selectedApplication.coverLetter || 'No cover letter was included with this application.'}</p></div>
      {/if}
      <div class="application-progress"><span class="eyebrow">APPLICATION PROGRESS</span><div class="progress-track"><i style={`width:${Math.max(8, (statusStages.indexOf(selectedApplication.status) + 1) / 6 * 100)}%`}></i></div><small>Applied {formatDate(selectedApplication.appliedAt)} · Last updated {formatDate(selectedApplication.updatedAt)}</small></div>

      {#if isHr}
        <form method="POST" action="?/updateApplication" use:enhance={enhanceWithLoading}>
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
          <button class="button primary full" type="submit" disabled={busyAction}>{#if busyAction}<span class="loading-spinner" aria-hidden="true"></span> Updating status…{:else}Update application status{/if}</button>
        </form>
        <section class="application-detail-block"><span class="eyebrow">INTERVIEW HISTORY</span><h3>Interviews for this application</h3>
          {#if selectedApplicationInterviews.length === 0}<p class="detail-muted">No interviews are linked to this application yet. Use Interviews → Schedule for an applicant to book one.</p>{:else}
            {#each selectedApplicationInterviews as interview}<div class="detail-interview"><span class="status {interview.status}">{interview.status}</span><strong>{interview.title}</strong><small>{interview.type} · {formatDateTime(interview.startsAt)} — {formatDateTime(interview.endsAt)}</small><a href={interview.meetingUrl || `/interview/${interview.roomCode}`} target={interview.meetingUrl ? '_blank' : undefined} rel={interview.meetingUrl ? 'noopener noreferrer' : undefined}>{interview.meetingUrl ? 'Join Google Meet ↗' : 'Google Meet link not added yet'}</a></div>{/each}
          {/if}
        </section>
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
