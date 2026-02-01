import { pgTable, uuid, text, timestamp, boolean, real, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// NextAuth.js Tables
// ============================================

// Users (NextAuth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NextAuth accounts (OAuth providers)
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
});

// NextAuth sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull(),
});

// NextAuth verification tokens (for email verification)
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ============================================
// Application Tables
// ============================================

// Workspaces (tenants)
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Business context for AI
  businessType: text("business_type"),
  businessDescription: text("business_description"),
  businessHours: text("business_hours"),
  businessTone: text("business_tone"), // 'formal' | 'friendly' | 'casual'
  customInstructions: text("custom_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-workspace membership (for team support)
export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull().default("owner"), // 'owner' | 'admin' | 'member'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email account connections
export const emailConnections = pgTable("email_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  provider: text("provider").notNull(), // 'gmail' | 'outlook'
  emailAddress: text("email_address").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cached emails
export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id")
    .references(() => emailConnections.id)
    .notNull(),
  externalId: text("external_id").notNull(), // Gmail message ID
  threadId: text("thread_id").notNull(),
  subject: text("subject"),
  fromAddress: text("from_address"),
  toAddresses: text("to_addresses").array(),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  isRead: boolean("is_read").default(false),
  receivedAt: timestamp("received_at"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

// AI Drafts (generated responses awaiting review)
export const drafts = pgTable("drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailId: uuid("email_id")
    .references(() => emails.id)
    .notNull(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  // Classification
  intent: text("intent").notNull(),
  intentConfidence: real("intent_confidence").notNull(),
  extractedInfo: jsonb("extracted_info"),
  // Generated response
  responseSubject: text("response_subject"),
  responseBody: text("response_body"),
  responseConfidence: real("response_confidence"),
  // Status
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'edited' | 'rejected' | 'sent'
  action: text("action").notNull(), // 'draft' | 'escalate' | 'ignore'
  // Metadata
  processingTimeMs: real("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  sentAt: timestamp("sent_at"),
});

// Activity logs (audit trail)
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  emailId: uuid("email_id").references(() => emails.id),
  draftId: uuid("draft_id").references(() => drafts.id),
  // Activity
  type: text("type").notNull(), // 'email_received' | 'classified' | 'response_generated' | 'draft_approved' | 'sent' | 'escalated'
  data: jsonb("data"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  workspaceMembers: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  emailConnections: many(emailConnections),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

// ============================================
// Types
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type EmailConnection = typeof emailConnections.$inferSelect;
export type NewEmailConnection = typeof emailConnections.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
