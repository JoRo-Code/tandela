import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Workspaces (tenants)
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
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

// Types
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type EmailConnection = typeof emailConnections.$inferSelect;
export type NewEmailConnection = typeof emailConnections.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
