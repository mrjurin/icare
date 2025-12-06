import { pgTable, serial, integer, text, timestamp, varchar, doublePrecision, index, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Existing table from initial migration
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enums for issues
export const issueStatusEnum = pgEnum("issue_status", ["pending", "in_progress", "resolved", "closed"]);
export const issueCategoryEnum = pgEnum("issue_category", [
  "road_maintenance",
  "drainage",
  "public_safety",
  "sanitation",
  "other",
]);

export const issues = pgTable(
  "issues",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporter_id").references(() => profiles.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: issueCategoryEnum("category").default("other").notNull(),
    status: issueStatusEnum("status").default("pending").notNull(),
    address: text("address").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("issues_status_idx").on(table.status),
    index("issues_reporter_idx").on(table.reporterId),
    index("issues_created_idx").on(table.createdAt),
  ]
);

export const issueMedia = pgTable(
  "issue_media",
  {
    id: serial("id").primaryKey(),
    issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
    url: text("url").notNull(),
    type: varchar("type", { length: 16 }).default("image").notNull(),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("issue_media_issue_idx").on(table.issueId),
  ]
);

export const supportRequests = pgTable(
  "support_requests",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).default("open").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    respondedAt: timestamp("responded_at"),
  },
  (table) => [
    index("support_requests_status_idx").on(table.status),
    index("support_requests_created_idx").on(table.createdAt),
  ]
);

// Additional tables to support ADUN service use cases
export const issueFeedback = pgTable(
  "issue_feedback",
  {
    id: serial("id").primaryKey(),
    issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
    profileId: integer("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    comments: text("comments"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("issue_feedback_issue_idx").on(table.issueId),
    index("issue_feedback_profile_idx").on(table.profileId),
  ]
);

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 16 }).default("general").notNull(),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("announcements_published_idx").on(table.publishedAt),
    index("announcements_category_idx").on(table.category),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 16 }).default("system").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_profile_idx").on(table.profileId),
    index("notifications_read_idx").on(table.read),
    index("notifications_created_idx").on(table.createdAt),
  ]
);

export const issueAssignments = pgTable(
  "issue_assignments",
  {
    id: serial("id").primaryKey(),
    issueId: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
    assigneeId: integer("assignee_id").references(() => profiles.id, { onDelete: "set null" }),
    status: varchar("status", { length: 16 }).default("assigned").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("issue_assignments_issue_idx").on(table.issueId),
    index("issue_assignments_assignee_idx").on(table.assigneeId),
    index("issue_assignments_status_idx").on(table.status),
  ]
);

// Relations (optional for Drizzle ORM usage later)
export const issuesRelations = relations(issues, ({ many }) => ({
  media: many(issueMedia),
  feedback: many(issueFeedback),
  assignments: many(issueAssignments),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  issues: many(issues),
  notifications: many(notifications),
  assignments: many(issueAssignments),
}));
