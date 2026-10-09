/*
   Disclaimer: Property of origins ltd. united kingdom.
   privacy policy: https://www.origins-software.com/privacy
   terms of service: https://www.origins-software.com/terms
*/
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
  applications,
  applicationEvents,
  interviews,
  jobs,
  messages,
  notifications,
  profiles
} from '$lib/server/db/schema';

const HR_ROLES = ['owner', 'admin', 'recruiter', 'hiring_manager'] as const;
const PORTAL_ROLES = ['owner', 'admin', 'recruiter', 'hiring_manager', 'applicant'] as const;
const APPLICATION_STATUSES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired',
  'rejected',
  'withdrawn'
] as const;

type HrRole = (typeof HR_ROLES)[number];
type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

function isHr(role: string): role is HrRole {
  return HR_ROLES.includes(role as HrRole);
}

function hasPortalAccess(role: string): role is (typeof PORTAL_ROLES)[number] {
  return PORTAL_ROLES.includes(role as (typeof PORTAL_ROLES)[number]);
}

async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const profile = await getProfile(locals.user.id);

  if (!profile) {
    throw redirect(303, '/login?error=profile');
  }

  if (!hasPortalAccess(profile.role)) {
    throw redirect(303, '/login?error=portal_access');
  }

  const openJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'open'))
    .orderBy(desc(jobs.createdAt));

  if (isHr(profile.role)) {
    const [allJobs, allApplications, allInterviews] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(applications).orderBy(desc(applications.updatedAt)),
      db.select().from(interviews).orderBy(desc(interviews.startsAt))
    ]);

    const applicantIds = [...new Set(allApplications.map((item) => item.applicantId))];
    const jobIds = [...new Set(allApplications.map((item) => item.jobId))];
    const applicationIds = allApplications.map((item) => item.id);

    const [applicantRows, jobRows, hrMessages, hrNotifications] = await Promise.all([
      applicantIds.length
        ? db.select().from(profiles).where(inArray(profiles.id, applicantIds))
        : Promise.resolve([]),
      jobIds.length
        ? db.select().from(jobs).where(inArray(jobs.id, jobIds))
        : Promise.resolve([]),
      applicationIds.length
        ? db
            .select()
            .from(messages)
            .where(inArray(messages.applicationId, applicationIds))
            .orderBy(desc(messages.createdAt))
        : Promise.resolve([]),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.profileId, profile.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20)
    ]);

    const applicantMap = new Map(applicantRows.map((item) => [item.id, item]));
    const jobMap = new Map(jobRows.map((item) => [item.id, item]));

    return {
      profile,
      role: profile.role,
      jobs: allJobs,
      openJobs,
      applications: allApplications.map((application) => ({
        ...application,
        applicant: applicantMap.get(application.applicantId) ?? null,
        job: jobMap.get(application.jobId) ?? null
      })),
      interviews: allInterviews,
      messages: hrMessages,
      notifications: hrNotifications,
      stats: {
        applicants: applicantRows.length,
        applications: allApplications.length,
        interviews: allInterviews.filter((item) => item.status !== 'cancelled').length,
        openJobs: allJobs.filter((job) => job.status === 'open').length,
        active: allApplications.filter(
          (item) => !['rejected', 'withdrawn', 'hired'].includes(item.status)
        ).length,
        offers: allApplications.filter((item) => item.status === 'offer').length
      }
    };
  }

  const myApplications = await db
    .select()
    .from(applications)
    .where(eq(applications.applicantId, profile.id))
    .orderBy(desc(applications.updatedAt));

  const myJobIds = [...new Set(myApplications.map((item) => item.jobId))];
  const myApplicationIds = myApplications.map((item) => item.id);

  const [myJobs, myInterviews, myMessages, myNotifications] = await Promise.all([
    myJobIds.length
      ? db.select().from(jobs).where(inArray(jobs.id, myJobIds))
      : Promise.resolve([]),
    myApplicationIds.length
      ? db
          .select()
          .from(interviews)
          .where(inArray(interviews.applicationId, myApplicationIds))
          .orderBy(desc(interviews.startsAt))
      : Promise.resolve([]),
    myApplicationIds.length
      ? db
          .select()
          .from(messages)
          .where(inArray(messages.applicationId, myApplicationIds))
          .orderBy(desc(messages.createdAt))
      : Promise.resolve([]),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.profileId, profile.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20)
  ]);

  const jobMap = new Map(myJobs.map((job) => [job.id, job]));

  return {
    profile,
    role: profile.role,
    jobs: openJobs,
    openJobs,
    applications: myApplications.map((application) => ({
      ...application,
      applicant: null,
      job: jobMap.get(application.jobId) ?? null
    })),
    interviews: myInterviews,
    messages: myMessages,
    notifications: myNotifications,
    stats: {
      applicants: 0,
      applications: myApplications.length,
      interviews: myInterviews.filter(
        (item) => !['cancelled', 'completed', 'no_show'].includes(item.status)
      ).length,
      openJobs: openJobs.length,
      active: myApplications.filter(
        (item) => !['rejected', 'withdrawn', 'hired'].includes(item.status)
      ).length,
      offers: myApplications.filter((item) => item.status === 'offer').length
    }
  };
};

export const actions: Actions = {
  logout: async ({ locals }) => {
    await locals.supabase.auth.signOut();
    throw redirect(303, '/login');
  },

  apply: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const profile = await getProfile(locals.user.id);
    if (!profile || profile.role !== 'applicant') {
      return fail(403, { error: 'Only applicant accounts can submit applications.' });
    }

    const form = await request.formData();
    const jobId = String(form.get('jobId') ?? '').trim();
    const coverLetter = String(form.get('coverLetter') ?? '').trim();
    const resume = form.get('resume');

    if (!jobId) return fail(400, { error: 'Select a job.' });
    if (!(resume instanceof File) || resume.size === 0) {
      return fail(400, { error: 'Please choose your CV or resume before submitting.' });
    }
    if (resume.size > 10 * 1024 * 1024) {
      return fail(400, { error: 'Your CV must be 10 MB or smaller.' });
    }

    const allowedResumeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const extension = resume.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'doc', 'docx'].includes(extension) || !allowedResumeTypes.has(resume.type)) {
      return fail(400, { error: 'Upload a PDF, DOC, or DOCX file.' });
    }
    if (coverLetter.length > 10000) {
      return fail(400, { error: 'Cover letter is too long.' });
    }

    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.status, 'open')))
      .limit(1);

    if (!job) return fail(404, { error: 'That position is no longer open.' });

    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(eq(applications.jobId, jobId), eq(applications.applicantId, profile.id))
      )
      .limit(1);

    if (existing) {
      return fail(409, { error: 'You have already applied for this position.' });
    }

    let uploadedResumePath: string | null = null;
    try {
      // Keep CVs in a private Supabase Storage bucket; never store file bytes in the database.
      // Create a private bucket named `resumes` in Supabase Storage before enabling applications.
      const safeExtension = extension;
      const storagePath = `${profile.id}/${crypto.randomUUID()}.${safeExtension}`;
      const { error: uploadError } = await locals.supabase.storage
        .from('resumes')
        .upload(storagePath, resume, {
          contentType: resume.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Resume upload failed', { message: uploadError.message });
        return fail(502, {
          error: 'Your CV could not be uploaded. Please try again. If this continues, contact the hiring team.'
        });
      }
      uploadedResumePath = storagePath;

      const created = await db.transaction(async (tx) => {
        const [application] = await tx
          .insert(applications)
          .values({
            jobId,
            applicantId: profile.id,
            coverLetter: coverLetter || null,
            resumePath: storagePath
          })
          .returning({ id: applications.id });

        if (!application) throw new Error('Application was not created.');

        await tx.insert(applicationEvents).values({
          applicationId: application.id,
          actorId: profile.id,
          toStatus: 'applied',
          note: 'Application submitted with CV.'
        });

        return application;
      });

      return {
        success: true,
        message: 'Application submitted.',
        applicationId: created.id
      };
    } catch (error) {
      if (uploadedResumePath) {
        const { error: cleanupError } = await locals.supabase.storage
          .from('resumes')
          .remove([uploadedResumePath]);
        if (cleanupError) {
          console.error('Resume cleanup failed', { message: cleanupError.message });
        }
      }
      console.error('Application creation failed', error);
      return fail(500, {
        error: 'The application could not be submitted. Please try again.'
      });
    }
  },

  updateApplication: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const profile = await getProfile(locals.user.id);
    if (!profile || !isHr(profile.role)) {
      return fail(403, { error: 'HR access required.' });
    }

    const form = await request.formData();
    const applicationId = String(form.get('applicationId') ?? '').trim();
    const status = String(form.get('status') ?? '') as ApplicationStatus;
    const note = String(form.get('note') ?? '').trim();

    if (!applicationId) return fail(400, { error: 'Application is required.' });
    if (!APPLICATION_STATUSES.includes(status)) {
      return fail(400, { error: 'Invalid application status.' });
    }
    if (note.length > 5000) {
      return fail(400, { error: 'Internal note is too long.' });
    }

    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application) return fail(404, { error: 'Application not found.' });
    if (application.status === status) {
      return { success: true, message: 'No status change was needed.' };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ status, updatedAt: new Date() })
        .where(eq(applications.id, applicationId));

      await tx.insert(applicationEvents).values({
        applicationId,
        actorId: profile.id,
        fromStatus: application.status,
        toStatus: status,
        note: note || null
      });

      await tx.insert(notifications).values({
        profileId: application.applicantId,
        title: 'Application updated',
        body: `Your application status is now ${status}.`,
        data: { applicationId, status }
      });
    });

    return { success: true, message: 'Application updated.' };
  },

  scheduleInterview: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    const profile = await getProfile(locals.user.id);
    if (!profile || !isHr(profile.role)) return fail(403, { error: 'HR access required.' });

    const form = await request.formData();
    const applicationId = String(form.get('applicationId') ?? '').trim();
    const title = String(form.get('title') ?? '').trim();
    const type = String(form.get('type') ?? 'video');
    const meetingUrl = String(form.get('meetingUrl') ?? '').trim();
    const startsAt = new Date(String(form.get('startsAt') ?? ''));
    const endsAt = new Date(String(form.get('endsAt') ?? ''));
    if (!applicationId || !title) return fail(400, { error: 'Choose an application and enter an interview title.' });
    if (title.length > 160) return fail(400, { error: 'Interview title is too long.' });
    if (!['video', 'phone', 'onsite'].includes(type)) return fail(400, { error: 'Choose a valid interview format.' });
    if (type === 'video' && !meetingUrl) return fail(400, { error: 'Add the Google Meet link provided by HR.' });
    if (meetingUrl) {
      try {
        const parsedUrl = new URL(meetingUrl);
        if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'meet.google.com') throw new Error('invalid meeting URL');
      } catch {
        return fail(400, { error: 'Enter a valid Google Meet link beginning with https://meet.google.com/.' });
      }
    }
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return fail(400, { error: 'Enter a valid start and end time. The end must be after the start.' });
    }
    if (endsAt.getTime() - startsAt.getTime() > 8 * 60 * 60 * 1000) return fail(400, { error: 'An interview cannot be longer than eight hours.' });

    const [application] = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    if (!application) return fail(404, { error: 'Application not found.' });

    const roomCode = crypto.randomUUID().replace(/-/g, '').slice(0, 18);
    await db.transaction(async (tx) => {
      await tx.insert(interviews).values({
        applicationId,
        interviewerId: profile.id,
        title,
        type: type as 'video' | 'phone' | 'onsite',
        status: 'scheduled',
        startsAt,
        endsAt,
        roomCode,
        meetingUrl: meetingUrl || null
      });
      if (application.status !== 'interview') {
        await tx.update(applications).set({ status: 'interview', updatedAt: new Date() }).where(eq(applications.id, applicationId));
        await tx.insert(applicationEvents).values({ applicationId, actorId: profile.id, fromStatus: application.status, toStatus: 'interview', note: `Interview scheduled: ${title}` });
      }
      await tx.insert(notifications).values({
        profileId: application.applicantId,
        title: 'Interview scheduled',
        body: `${title} has been scheduled for ${startsAt.toLocaleString('en-GB')}.${meetingUrl ? ` Join using Google Meet: ${meetingUrl}` : ''}`,
        data: { applicationId, roomCode, meetingUrl: meetingUrl || null, startsAt: startsAt.toISOString() }
      });
    });
    return { success: true, message: 'Interview scheduled and linked to the application.' };
  },

  createJob: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const profile = await getProfile(locals.user.id);
    if (!profile || !isHr(profile.role)) {
      return fail(403, { error: 'HR access required.' });
    }

    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const department = String(form.get('department') ?? '').trim();
    const location = String(form.get('location') ?? '').trim();
    const employmentType = String(form.get('employmentType') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();

    if (!title || !department || !location || !employmentType || !description) {
      return fail(400, { error: 'Complete all job fields.' });
    }

    if ([title, department, location, employmentType].some((value) => value.length > 160)) {
      return fail(400, { error: 'One or more job fields are too long.' });
    }

    if (description.length > 30000) {
      return fail(400, { error: 'Job description is too long.' });
    }

    const slug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${crypto.randomUUID().slice(0, 8)}`;

    const [job] = await db
      .insert(jobs)
      .values({
        title,
        slug,
        department,
        location,
        employmentType,
        description,
        hiringManagerId: profile.id,
        status: 'open'
      })
      .returning({ id: jobs.id });

    if (!job) return fail(500, { error: 'The job could not be published.' });

    return { success: true, message: 'Job published.', jobId: job.id };
  },

  sendMessage: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');

    const profile = await getProfile(locals.user.id);
    if (!profile || !hasPortalAccess(profile.role)) {
      return fail(403, { error: 'Portal access required.' });
    }

    const form = await request.formData();
    const applicationId = String(form.get('applicationId') ?? '').trim();
    const body = String(form.get('body') ?? '').trim();

    if (!applicationId || !body) {
      return fail(400, { error: 'Application and message are required.' });
    }

    if (body.length > 10000) {
      return fail(400, { error: 'Message is too long.' });
    }

    const [application] = await db
      .select({ applicantId: applications.applicantId })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application) return fail(404, { error: 'Application not found.' });

    const allowed =
      application.applicantId === profile.id || isHr(profile.role);

    if (!allowed) {
      return fail(403, { error: 'You do not have access to this application.' });
    }

    await db.insert(messages).values({
      applicationId,
      senderId: profile.id,
      body
    });

    const recipientId =
      application.applicantId === profile.id
        ? null
        : application.applicantId;

    if (recipientId) {
      await db.insert(notifications).values({
        profileId: recipientId,
        title: 'New message',
        body: 'You have a new message about your application.',
        data: { applicationId }
      });
    }

    return { success: true, message: 'Message sent.' };
  }
};
