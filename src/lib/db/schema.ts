import { pgTable, uuid, text, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";

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

// Types
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type EmailConnection = typeof emailConnections.$inferSelect;
export type NewEmailConnection = typeof emailConnections.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
