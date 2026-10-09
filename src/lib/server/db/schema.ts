import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum, uniqueIndex
} from 'drizzle-orm/pg-core';

export const applicationStatus = pgEnum('application_status', [
  'applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn'
]);
export const interviewStatus = pgEnum('interview_status', [
  'scheduled', 'confirmed', 'live', 'completed', 'cancelled', 'no_show'
]);
export const interviewType = pgEnum('interview_type', ['video', 'phone', 'onsite']);
export const userRole = pgEnum('user_role', [
  'owner',
  'admin',
  'member',
  'client',
  'applicant',
  'recruiter',
  'hiring_manager'
]);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: userRole('role').notNull().default('applicant'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  employmentType: text('employment_type').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('open'),
  hiringManagerId: uuid('hiring_manager_id').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  applicantId: uuid('applicant_id').references(() => profiles.id).notNull(),
  status: applicationStatus('status').notNull().default('applied'),
  coverLetter: text('cover_letter'),
  resumePath: text('resume_path'),
  source: text('source').default('careers_site'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  applicantJob: uniqueIndex('applications_applicant_job_idx').on(t.applicantId, t.jobId)
}));

export const applicationEvents = pgTable('application_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  actorId: uuid('actor_id').references(() => profiles.id),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const interviews = pgTable('interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  interviewerId: uuid('interviewer_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  type: interviewType('type').notNull().default('video'),
  status: interviewStatus('status').notNull().default('scheduled'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  roomCode: text('room_code').notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const interviewParticipants = pgTable('interview_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  interviewId: uuid('interview_id').references(() => interviews.id).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true })
}, (t) => ({
  uniqueParticipant: uniqueIndex('interview_participant_idx').on(t.interviewId, t.profileId)
}));

export const messages = pgTable('talent_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  senderId: uuid('sender_id').references(() => profiles.id).notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const interviewNotes = pgTable('interview_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  interviewId: uuid('interview_id').references(() => interviews.id).notNull(),
  authorId: uuid('author_id').references(() => profiles.id).notNull(),
  score: integer('score'),
  recommendation: text('recommendation'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const notifications = pgTable('talent_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

