import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { applications, interviews, jobs, profiles } from '$lib/server/db/schema';

const hrRoles = ['recruiter', 'hiring_manager', 'admin'];

export const load = async ({ locals, params }) => {
  if (!locals.user) throw redirect(303, '/login');
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, locals.user.id)).limit(1);
  if (!profile) throw redirect(303, '/login');

  const [interview] = await db.select().from(interviews).where(eq(interviews.roomCode, params.room)).limit(1);
  if (!interview) throw error(404, 'Interview not found.');

  const [application] = await db.select().from(applications).where(eq(applications.id, interview.applicationId)).limit(1);
  if (!application) throw error(404, 'Application not found.');

  const allowed = application.applicantId === profile.id || (hrRoles.includes(profile.role) && interview.interviewerId === profile.id);
  if (!allowed) throw error(403, 'You are not authorised to view this interview.');

  const [job] = await db.select().from(jobs).where(eq(jobs.id, application.jobId)).limit(1);
  const [interviewer] = await db.select().from(profiles).where(eq(profiles.id, interview.interviewerId)).limit(1);
  const [applicant] = await db.select().from(profiles).where(eq(profiles.id, application.applicantId)).limit(1);

  return {
    role: application.applicantId === profile.id ? 'candidate' : 'interviewer',
    profile,
    interview,
    application,
    job: job ?? null,
    interviewer: interviewer ?? null,
    applicant: applicant ?? null
  };
};
