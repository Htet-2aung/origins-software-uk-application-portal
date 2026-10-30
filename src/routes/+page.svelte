
<script lang="ts">
  import './careers.css';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let query = '';
  let location = '';
  let type = 'All types';
  let sort = 'newest';
  let selected: string | null = null;
  let saved: string[] = [];
  let mobileDetails = false;
  let typeDropdownOpen = false;
  let sortDropdownOpen = false;
  let keywordFocused = false;

  $: employmentTypes = [
    ...new Set(data.openJobs.map((job) => job.employmentType))
  ];

  $: matching = data.openJobs.filter((job) => {
    const term = query.trim().toLowerCase();
    const place = location.trim().toLowerCase();

    return (
      `${job.title} ${job.department} ${job.description}`
        .toLowerCase()
        .includes(term) &&
      job.location.toLowerCase().includes(place) &&
      (type === 'All types' || job.employmentType === type)
    );
  });

  $: ordered = [...matching].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    return sort === 'oldest'
      ? aTime - bTime
      : bTime - aTime;
  });

  $: current =
    ordered.find((job) => job.id === selected) ?? ordered[0];

  $: hasFilters =
    query.trim() !== '' ||
    location.trim() !== '' ||
    type !== 'All types';

  function selectJob(id: string) {
    selected = id;
    mobileDetails = true;
  }

  function clearFilters() {
    query = '';
    location = '';
    type = 'All types';
    selected = null;
  }

  function toggleSaved(id: string) {
    saved = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];

    try {
      localStorage.setItem(
        'origins-saved-jobs',
        JSON.stringify(saved)
      );
    } catch {
      // Saving locally may be unavailable in private browsing.
    }
  }

  function shortDate(value: Date | string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function isNew(value: Date | string) {
    const age = Date.now() - new Date(value).getTime();
    return age >= 0 && age <= 7 * 86400000;
  }

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.type-field')) {
      typeDropdownOpen = false;
    }
    if (!target.closest('.sort-field')) {
      sortDropdownOpen = false;
    }
  }

  onMount(() => {
    try {
      const items = JSON.parse(
        localStorage.getItem('origins-saved-jobs') ?? '[]'
      );

      if (Array.isArray(items)) {
        saved = items.filter(
          (item): item is string => typeof item === 'string'
        );
      }
    } catch {
      saved = [];
    }
  });
</script>

<svelte:head>
  <title>Careers & Open Positions | Origins Software</title>
  <meta
    name="description"
    content="Discover career opportunities at Origins Software. Explore our open positions, learn about the company and apply securely through our candidate portal."
  />
</svelte:head>

<svelte:window onclick={handleOutsideClick} />

<div class="careers">

  <!-- CORPORATE HEADER -->
  <header class="career-nav">
    <div class="board-container nav-inner">

      <a href="/" class="career-logo" aria-label="Origins Software Careers">
        <img
          src="/images/origins-logo.png"
          alt=""
          width="42"
          height="42"
        />

        <span class="logo-copy">
          <strong>ORIGINS</strong>
          <small>SOFTWARE <span>/</span> CAREERS</small>
        </span>
      </a>

      <nav class="desktop-nav" aria-label="Main navigation">
        <a href="#jobs">Opportunities</a>
        <a href="#about">About Origins</a>
        <a href="#process">How we hire</a>
        <a
          href="https://www.origins-software.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Company website <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <div class="nav-actions">
        {#if data.signedIn}
          <a class="nav-cta" href="/account">
            My dashboard <span aria-hidden="true">↗</span>
          </a>
        {:else}
          <a class="sign-in" href="/login">Sign in</a>
          <a class="nav-cta" href="/signup">
            Create account <span aria-hidden="true">↗</span>
          </a>
        {/if}
      </div>

    </div>
  </header>

  <main>

    <!-- EDITORIAL INTRO: NO FULL-SCREEN HERO -->
    <section class="career-intro">
      <div class="board-container intro-layout">

        <div class="intro-main">
          <div class="section-index">
            <span class="index-line"></span>
            ORIGINS SOFTWARE / CAREERS
          </div>

          <h1>
            Build meaningful work.
            <span>Find your place.</span>
          </h1>

          <p>
            Discover opportunities at Origins Software.
            Explore available roles, find the right fit for your
            experience, and take your next step with us.
          </p>

          <div class="intro-links">
            <a href="#jobs" class="intro-primary">
              Explore opportunities
              <span aria-hidden="true">↗</span>
            </a>

            <a href="#about" class="intro-secondary">
              Get to know Origins
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div class="intro-aside">
          <span class="aside-label">CURRENTLY RECRUITING</span>

          <div class="aside-count">
            {data.openJobs.length.toString().padStart(2, '0')}
          </div>

          <strong>Open opportunities</strong>

          <div class="aside-bottom">
            <span class="status-dot"></span>
            Browse published positions
          </div>
        </div>

      </div>
    </section>

    <!-- JOB BOARD -->
    <section class="jobs-section" id="jobs">
      <div class="board-container">

        <div class="section-heading">
          <div>
            <span class="section-index">
              <span class="index-line"></span>
              01 / OPEN OPPORTUNITIES
            </span>

            <h2>Explore available positions.</h2>

            <p>
              Search by role, keyword, location or employment type.
            </p>
          </div>

          <div class="positions-count">
            <span class="status-dot"></span>
            <strong>{data.openJobs.length}</strong>
            positions published
          </div>
        </div>

        <!-- SEARCH -->
        <div class="search-shell">

          <label class="search-field keyword-field">
            <span class="field-label">KEYWORD OR ROLE</span>

            <span class="field-control">
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor"
                stroke-width="1.8" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="7"></circle>
                <path d="m16 16 5 5"></path>
              </svg>

              <input
                bind:value={query}
                type="search"
                placeholder="Job title, skill or department"
                aria-label="Search job title, skill or department"
                onfocus={() => keywordFocused = true}
                onblur={() => keywordFocused = false}
                style="width: {keywordFocused ? '260px' : '170px'}; transition: width 0.3s ease; text-overflow: ellipsis;"
              />
            </span>
          </label>

          <label class="search-field location-field" style="display: flex; flex-direction: column; align-items: center;">
            <span class="field-label">LOCATION</span>

            <span class="field-control">
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor"
                stroke-width="1.8" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>
                <circle cx="12" cy="10" r="2.5"></circle>
              </svg>

              <input
                bind:value={location}
                placeholder="City or remote"
                aria-label="Filter jobs by location"
              />
            </span>
          </label>

          <div class="search-field type-field">
            <span class="field-label">EMPLOYMENT</span>

            <div class="custom-select" style="position: relative; width: 100%;">
              <button
                type="button"
                class="field-control"
                onclick={() => typeDropdownOpen = !typeDropdownOpen}
                aria-haspopup="listbox"
                aria-expanded={typeDropdownOpen}
                style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; padding: 0; text-align: left; cursor: pointer; color: inherit; font: inherit;"
              >
                <span>{type === 'All types' ? 'All employment types' : type}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" style="transition: transform 0.2s;" style:transform={typeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'}>
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>

              {#if typeDropdownOpen}
                <div 
                  class="custom-options" 
                  role="listbox"
                  style="position: absolute; top: calc(100% + 8px); left: 0; width: 100%; z-index: 50; background: var(--bg-surface, #1e1e1e); border: 1px solid var(--border-color, #333); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={type === 'All types'}
                    class:selected={type === 'All types'}
                    style="text-align: left; padding: 10px 16px; background: transparent; border: none; cursor: pointer; color: inherit; font: inherit;"
                    onclick={() => { type = 'All types'; typeDropdownOpen = false; }}
                  >
                    All employment types
                  </button>
                  {#each employmentTypes as employmentType}
                    <button
                      type="button"
                      role="option"
                      aria-selected={type === employmentType}
                      class:selected={type === employmentType}
                      style="text-align: left; padding: 10px 16px; background: transparent; border: none; cursor: pointer; color: inherit; font: inherit;"
                      onclick={() => { type = employmentType; typeDropdownOpen = false; }}
                    >
                      {employmentType}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <a class="search-action" href="#results">
            View roles <span aria-hidden="true">↗</span>
          </a>

        </div>

        <div class="results-toolbar" id="results">
          <span>
            Showing <strong>{matching.length}</strong>
            of {data.openJobs.length} opportunities
          </span>

          {#if hasFilters}
            <button onclick={clearFilters}>
              Clear filters <span aria-hidden="true">×</span>
            </button>
          {/if}
        </div>

        <div class="job-layout">

          <!-- JOB LIST COLUMN -->
          <div class="jobs-list">

            <div class="list-heading">
              <div>
                <h3>All positions</h3>
                <p>Select a role to view its complete description.</p>
              </div>

              <div class="sort-field" style="display: flex; align-items: center; gap: 8px;">
                <span>Sort by</span>
                
                <div class="custom-select" style="position: relative;">
                  <button
                    type="button"
                    class="field-control"
                    onclick={() => sortDropdownOpen = !sortDropdownOpen}
                    aria-haspopup="listbox"
                    aria-expanded={sortDropdownOpen}
                    style="display: flex; gap: 8px; justify-content: space-between; align-items: center; background: transparent; border: none; padding: 0; text-align: left; cursor: pointer; color: inherit; font: inherit;"
                  >
                    <span>{sort === 'newest' ? 'Newest first' : 'Oldest first'}</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" style="transition: transform 0.2s;" style:transform={sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'}>
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </button>

                  {#if sortDropdownOpen}
                    <div 
                      class="custom-options" 
                      role="listbox"
                      style="position: absolute; top: calc(100% + 8px); right: 0; min-width: 140px; z-index: 50; background: var(--bg-surface, #1e1e1e); border: 1px solid var(--border-color, #333); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={sort === 'newest'}
                        class:selected={sort === 'newest'}
                        style="text-align: left; padding: 10px 16px; background: transparent; border: none; cursor: pointer; color: inherit; font: inherit; white-space: nowrap;"
                        onclick={() => { sort = 'newest'; sortDropdownOpen = false; }}
                      >
                        Newest first
                      </button>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sort === 'oldest'}
                        class:selected={sort === 'oldest'}
                        style="text-align: left; padding: 10px 16px; background: transparent; border: none; cursor: pointer; color: inherit; font: inherit; white-space: nowrap;"
                        onclick={() => { sort = 'oldest'; sortDropdownOpen = false; }}
                      >
                        Oldest first
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <div class="listing-stack">
              {#each ordered as job (job.id)}
                <article
                  class="listing"
                  class:chosen={current?.id === job.id}
                >
                  <button
                    class="listing-main"
                    onclick={() => selectJob(job.id)}
                    aria-pressed={current?.id === job.id}
                  >
                    <div class="listing-top">
                      <span class="department">{job.department}</span>

                      {#if isNew(job.createdAt)}
                        <span class="new-label">
                          <span class="status-dot"></span>
                          NEW
                        </span>
                      {/if}
                    </div>

                    <h4>{job.title}</h4>

                    <div class="listing-meta">
                      <span>{job.location}</span>
                      <span class="meta-divider">/</span>
                      <span>{job.employmentType}</span>
                    </div>

                    <p class="listing-excerpt">
                      {job.description.slice(0, 145)}
                      {job.description.length > 145 ? '…' : ''}
                    </p>

                    <div class="listing-footer">
                      <span>Posted {shortDate(job.createdAt)}</span>
                      <span aria-hidden="true" style="opacity: 0.5; display: flex; align-items: center;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                    </div>
                  </button>

                  
                </article>
              {:else}
                <div class="empty-state">
                  <div class="empty-symbol">⌕</div>
                  <h4>No matching positions</h4>
                  <p>
                    Try another keyword or broaden your location
                    and employment filters.
                  </p>
                  <button onclick={clearFilters}>Reset search ↗</button>
                </div>
              {/each}
            </div>

            
          </div>

          <!-- STICKY JOB DETAIL COLUMN -->
          <aside
            class="job-detail"
            class:mobile-open={mobileDetails}
            aria-label="Position details"
          >
            {#if current}
              <div class="detail-topline">
                <span>POSITION OVERVIEW</span>
                <span>ORIGINS SOFTWARE</span>
              </div>

              <button
                class="mobile-back"
                onclick={() => mobileDetails = false}
              >
                ← Back to positions
              </button>

              <div class="detail-heading">
                <span class="department">{current.department}</span>
                <h3>{current.title}</h3>
                <p>Discover the position and review its requirements.</p>
              </div>

              <div class="detail-facts">
                <div>
                  <span>LOCATION</span>
                  <strong>{current.location}</strong>
                </div>

                <div>
                  <span>EMPLOYMENT</span>
                  <strong>{current.employmentType}</strong>
                </div>

                <div>
                  <span>DATE POSTED</span>
                  <strong>{shortDate(current.createdAt)}</strong>
                </div>
              </div>

              <div class="detail-actions">
                <a
                  class="apply-button"
                  href={data.signedIn
                    ? `/account?job=${current.id}`
                    : `/signup?next=${encodeURIComponent(`/account?job=${current.id}`)}`}
                >
                  {data.signedIn
                    ? 'Continue to application'
                    : 'Create account to apply'}
                  <span aria-hidden="true">↗</span>
                </a>

                
              </div>

              <div class="detail-description">
                <h4>About this role</h4>
                <div>{current.description}</div>
              </div>

              <div class="detail-signoff">
                <strong>ORIGINS SOFTWARE</strong>
                <span>BUILD BEYOND BOUNDARIES.</span>
              </div>
            {:else}
              <div class="detail-empty">
                <h3>No position available</h3>
                <p>
                  Select a published opportunity to see more information.
                </p>
              </div>
            {/if}
          </aside>

        </div>
      </div>
    </section>

    <!-- COMPANY INTRODUCTION -->
    <section class="company-section" id="about">
      <div class="board-container company-layout">

        <div class="company-title">
          <span class="section-index">
            <span class="index-line"></span>
            02 / ABOUT OUR COMPANY
          </span>

          <h2>
            Get to know
            <span>Origins Software.</span>
          </h2>
        </div>

        <div class="company-content">
          <p class="company-lead">
            We build software and digital solutions with a focus
            on thoughtful engineering and meaningful outcomes.
          </p>

          <p>
            Our Careers portal connects people with available
            opportunities at Origins Software. Explore our published
            positions, understand what each role involves, and learn
            more about the company through our corporate website.
          </p>

          <a
            class="company-link"
            href="https://www.origins-software.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <small>EXPLORE THE COMPANY</small>
              <strong>Visit our corporate website</strong>
              <em>www.origins-software.com</em>
            </span>

            <span class="company-link-icon" aria-hidden="true">↗</span>
          </a>
        </div>

      </div>
    </section>

    <!-- SIMPLE PROCESS -->
    <section class="process-section" id="process">
      <div class="board-container">

        <div class="process-heading">
          <div>
            <span class="section-index">
              <span class="index-line"></span>
              03 / RECRUITMENT PROCESS
            </span>

            <h2>A straightforward way to apply.</h2>
            <p>
              From discovering a position to tracking your application.
            </p>
          </div>
        </div>

        <div class="process-grid">
          <article>
            <span class="step-number">01</span>
            <h3>Explore a position</h3>
            <p>
              Search current openings and review the full job description.
            </p>
          </article>

          <article>
            <span class="step-number">02</span>
            <h3>Create your profile</h3>
            <p>
              Register with your email and prepare your candidate profile.
            </p>
          </article>

          <article>
            <span class="step-number">03</span>
            <h3>Apply and track</h3>
            <p>
              Submit your application and follow its status securely.
            </p>
          </article>
        </div>

      </div>
    </section>

  </main>

  <footer class="career-footer">
    <div class="board-container footer-inner">
      <div class="footer-identity">
        <img
          src="/images/origins-logo.png"
          width="34"
          height="34"
          alt=""
        />
        <div>
          <strong>ORIGINS SOFTWARE</strong>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>

      <nav aria-label="Footer navigation">
        <a href="https://www.origins-software.com/">Company</a>
        <a href="https://www.origins-software.com/privacy">Privacy</a>
        <a href="https://www.origins-software.com/terms">Terms</a>
        <a href="/login">Candidate sign in</a>
      </nav>
    </div>
  </footer>

</div>
