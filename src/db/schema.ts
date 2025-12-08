import { pgTable, serial, integer, text, timestamp, varchar, doublePrecision, index, pgEnum, boolean, type PgTableWithColumns } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums for profile verification (must be declared before profiles table)
export const profileVerificationStatusEnum = pgEnum("profile_verification_status", ["pending", "verified", "rejected"]);

// Enums for staff
export const staffRoleEnum = pgEnum("staff_role", ["adun", "super_admin", "zone_leader", "staff_manager", "staff"]);
export const staffStatusEnum = pgEnum("staff_status", ["active", "inactive"]);

// Enums for issues
export const issueStatusEnum = pgEnum("issue_status", ["pending", "in_progress", "resolved", "closed"]);
export const issueCategoryEnum = pgEnum("issue_category", [
  "road_maintenance",
  "drainage",
  "public_safety",
  "sanitation",
  "other",
]);

// Existing table from initial migration
// Note: Forward references to villages, zones, householdMembers, and staff are resolved later
// Using type assertion to avoid circular reference TypeScript error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const profiles: any = pgTable("profiles", {
  id: serial("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  avatarUrl: text("avatar_url"),
  icNumber: varchar("ic_number", { length: 20 }), // IC number for linking to household members
  villageId: integer("village_id").references(() => villages.id, { onDelete: "set null" }), // Village where user resides
  zoneId: integer("zone_id").references(() => zones.id, { onDelete: "set null" }), // Zone where user resides
  householdMemberId: integer("household_member_id").references(() => householdMembers.id, { onDelete: "set null" }), // Link to household member if exists
  verificationStatus: profileVerificationStatusEnum("verification_status").default("pending").notNull(), // Verification status by zone leader
  verifiedBy: integer("verified_by").references(() => staff.id, { onDelete: "set null" }), // Staff who verified the profile
  verifiedAt: timestamp("verified_at"), // When verification was completed
  verificationRemarks: text("verification_remarks"), // Remarks when revoking/rejecting verification
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("profiles_email_idx").on(table.email),
  index("profiles_ic_number_idx").on(table.icNumber),
  index("profiles_village_idx").on(table.villageId),
  index("profiles_zone_idx").on(table.zoneId),
  index("profiles_verification_status_idx").on(table.verificationStatus),
  index("profiles_household_member_idx").on(table.householdMemberId),
]);

// DUN (Dewan Undangan Negeri) table
export const duns = pgTable(
  "duns",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // e.g., "N.18 Inanam"
    code: varchar("code", { length: 20 }), // e.g., "N18"
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("duns_name_idx").on(table.name),
    index("duns_code_idx").on(table.code),
  ]
);

// Staff table for ADUN and their staff members
export const staff = pgTable(
  "staff",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"), // Nullable - staff can use IC number instead
    icNumber: varchar("ic_number", { length: 20 }), // IC number for login (Sabah context)
    phone: varchar("phone", { length: 20 }),
    role: staffRoleEnum("role").default("staff").notNull(),
    position: text("position"),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "set null" }), // For zone leaders
    status: staffStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("staff_role_idx").on(table.role),
    index("staff_status_idx").on(table.status),
    index("staff_email_idx").on(table.email),
    index("staff_ic_number_idx").on(table.icNumber),
    index("staff_zone_idx").on(table.zoneId),
  ]
);

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
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    status: varchar("status", { length: 16 }).default("assigned").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("issue_assignments_issue_idx").on(table.issueId),
    index("issue_assignments_staff_idx").on(table.staffId),
    index("issue_assignments_status_idx").on(table.status),
  ]
);

// Relations (optional for Drizzle ORM usage later)
export const issuesRelations = relations(issues, ({ many }) => ({
  media: many(issueMedia),
  feedback: many(issueFeedback),
  assignments: many(issueAssignments),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  issues: many(issues),
  notifications: many(notifications),
  village: one(villages, {
    fields: [profiles.villageId],
    references: [villages.id],
  }),
  zone: one(zones, {
    fields: [profiles.zoneId],
    references: [zones.id],
  }),
  householdMember: one(householdMembers, {
    fields: [profiles.householdMemberId],
    references: [householdMembers.id],
  }),
  verifiedByStaff: one(staff, {
    fields: [profiles.verifiedBy],
    references: [staff.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  zone: one(zones, {
    fields: [staff.zoneId],
    references: [zones.id],
  }),
  assignments: many(issueAssignments),
  roleAssignments: many(roleAssignments, {
    relationName: "staff_role_assignments",
  }),
  appointmentsMade: many(roleAssignments, {
    relationName: "appointed_by_staff",
  }),
  permissions: many(staffPermissions),
}));

// Enums for households
export const memberRelationshipEnum = pgEnum("member_relationship", [
  "head",
  "spouse",
  "child",
  "parent",
  "sibling",
  "other",
]);
export const memberStatusEnum = pgEnum("member_status", ["at_home", "away", "deceased"]);
export const dependencyStatusEnum = pgEnum("dependency_status", ["dependent", "independent"]);
export const votingSupportStatusEnum = pgEnum("voting_support_status", ["white", "black", "red"]);

// Zones table for managing zones
export const zones = pgTable(
  "zones",
  {
    id: serial("id").primaryKey(),
    dunId: integer("dun_id").references(() => duns.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("zones_name_idx").on(table.name),
    index("zones_dun_idx").on(table.dunId),
  ]
);

// Villages table for managing villages within zones
export const villages = pgTable(
  "villages",
  {
    id: serial("id").primaryKey(),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("villages_name_idx").on(table.name),
    index("villages_zone_idx").on(table.zoneId),
  ]
);

// Roles table - defines the roles available in the system
export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // e.g., "Branch Chief", "Village Chief"
    description: text("description"), // e.g., "Handles aids and household registration"
    responsibilities: text("responsibilities"), // Detailed responsibilities
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("roles_name_idx").on(table.name),
  ]
);

// Role assignments table - links staff to roles within zones or villages (appointed by ADUN)
// For Village Chief: villageId is required (one per village)
// For Branch Chief: villageId can be set for specific villages (can manage multiple villages)
// For other roles: villageId is typically null (zone-level)
export const roleAssignments = pgTable(
  "role_assignments",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "cascade" }).notNull(),
    roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "cascade" }).notNull(),
    villageId: integer("village_id").references(() => villages.id, { onDelete: "cascade" }), // For village-level appointments (Village Chief, or Branch Chief for specific villages)
    appointedBy: integer("appointed_by").references(() => staff.id, { onDelete: "set null" }), // ADUN who made the appointment
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, inactive
    appointedAt: timestamp("appointed_at").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("role_assignments_staff_idx").on(table.staffId),
    index("role_assignments_role_idx").on(table.roleId),
    index("role_assignments_zone_idx").on(table.zoneId),
    index("role_assignments_village_idx").on(table.villageId),
    index("role_assignments_appointed_by_idx").on(table.appointedBy),
    index("role_assignments_status_idx").on(table.status),
  ]
);

// Households table - Head of household information
export const households = pgTable(
  "households",
  {
    id: serial("id").primaryKey(),
    headOfHouseholdId: integer("head_of_household_id").references(() => profiles.id, { onDelete: "set null" }),
    headName: text("head_name").notNull(),
    headIcNumber: varchar("head_ic_number", { length: 20 }),
    headPhone: varchar("head_phone", { length: 20 }),
    address: text("address").notNull(),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "set null" }),
    area: text("area"), // Legacy field - kept for backward compatibility, use zoneId instead
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("households_head_idx").on(table.headOfHouseholdId),
    index("households_zone_idx").on(table.zoneId),
    index("households_area_idx").on(table.area),
  ]
);

// Household members table
export const householdMembers = pgTable(
  "household_members",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    icNumber: varchar("ic_number", { length: 20 }),
    relationship: memberRelationshipEnum("relationship").notNull(),
    dateOfBirth: timestamp("date_of_birth"),
    locality: text("locality"), // Voting place/locality for eligible voters
    status: memberStatusEnum("status").default("at_home").notNull(),
    dependencyStatus: dependencyStatusEnum("dependency_status").default("dependent").notNull(),
    votingSupportStatus: votingSupportStatusEnum("voting_support_status"), // White: full support, Black: not supporting, Red: not determined
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("household_members_household_idx").on(table.householdId),
    index("household_members_status_idx").on(table.status),
    index("household_members_dependency_idx").on(table.dependencyStatus),
    index("household_members_locality_idx").on(table.locality),
  ]
);

// Income information table
export const householdIncome = pgTable(
  "household_income",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
    monthlyIncome: doublePrecision("monthly_income"), // Total monthly income in RM
    incomeSource: text("income_source"), // e.g., "Employment", "Business", "Pension", "Government Aid"
    numberOfIncomeEarners: integer("number_of_income_earners").default(0).notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("household_income_household_idx").on(table.householdId),
  ]
);

// Aid distribution tracking table
export const aidDistributions = pgTable(
  "aid_distributions",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
    aidType: varchar("aid_type", { length: 100 }).notNull(), // e.g., "Food Basket", "Cash Aid", "Medical Supplies"
    quantity: integer("quantity").default(1).notNull(),
    distributedTo: integer("distributed_to").notNull(), // Number of people this aid was distributed to
    distributedBy: integer("distributed_by").references(() => staff.id, { onDelete: "set null" }),
    distributionDate: timestamp("distribution_date").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("aid_distributions_household_idx").on(table.householdId),
    index("aid_distributions_date_idx").on(table.distributionDate),
    index("aid_distributions_type_idx").on(table.aidType),
  ]
);

// Permissions table - defines available permissions in the system
export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 100 }).notNull(), // e.g., "register_household", "manage_staff"
    name: text("name").notNull(), // e.g., "Register Household", "Manage Staff"
    description: text("description"), // Detailed description of what this permission allows
    category: varchar("category", { length: 50 }), // e.g., "households", "staff", "zones"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("permissions_code_idx").on(table.code),
    index("permissions_category_idx").on(table.category),
  ]
);

// Staff permissions table - links staff to permissions
export const staffPermissions = pgTable(
  "staff_permissions",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "cascade" }).notNull(),
    permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
    grantedBy: integer("granted_by").references(() => staff.id, { onDelete: "set null" }), // Who granted this permission
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("staff_permissions_staff_idx").on(table.staffId),
    index("staff_permissions_permission_idx").on(table.permissionId),
    index("staff_permissions_granted_by_idx").on(table.grantedBy),
  ]
);

// Relations for DUNs
export const dunsRelations = relations(duns, ({ many }) => ({
  zones: many(zones),
}));

// Relations for zones
export const zonesRelations = relations(zones, ({ one, many }) => ({
  dun: one(duns, {
    fields: [zones.dunId],
    references: [duns.id],
  }),
  households: many(households),
  leaders: many(staff),
  roleAssignments: many(roleAssignments),
  villages: many(villages),
}));

// Relations for villages
export const villagesRelations = relations(villages, ({ one }) => ({
  zone: one(zones, {
    fields: [villages.zoneId],
    references: [zones.id],
  }),
}));

// Relations for roles
export const rolesRelations = relations(roles, ({ many }) => ({
  assignments: many(roleAssignments),
}));

// Relations for role assignments
export const roleAssignmentsRelations = relations(roleAssignments, ({ one }) => ({
  staff: one(staff, {
    fields: [roleAssignments.staffId],
    references: [staff.id],
    relationName: "staff_role_assignments",
  }),
  role: one(roles, {
    fields: [roleAssignments.roleId],
    references: [roles.id],
  }),
  zone: one(zones, {
    fields: [roleAssignments.zoneId],
    references: [zones.id],
  }),
  village: one(villages, {
    fields: [roleAssignments.villageId],
    references: [villages.id],
  }),
  appointedByStaff: one(staff, {
    fields: [roleAssignments.appointedBy],
    references: [staff.id],
    relationName: "appointed_by_staff",
  }),
}));

// Relations for households
export const householdsRelations = relations(households, ({ one, many }) => ({
  headProfile: one(profiles, {
    fields: [households.headOfHouseholdId],
    references: [profiles.id],
  }),
  zone: one(zones, {
    fields: [households.zoneId],
    references: [zones.id],
  }),
  members: many(householdMembers),
  income: many(householdIncome),
  aidDistributions: many(aidDistributions),
}));

export const householdMembersRelations = relations(householdMembers, ({ one, many }) => ({
  household: one(households, {
    fields: [householdMembers.householdId],
    references: [households.id],
  }),
  profile: many(profiles), // A household member can be linked to a profile
}));

export const householdIncomeRelations = relations(householdIncome, ({ one }) => ({
  household: one(households, {
    fields: [householdIncome.householdId],
    references: [households.id],
  }),
}));

export const aidDistributionsRelations = relations(aidDistributions, ({ one }) => ({
  household: one(households, {
    fields: [aidDistributions.householdId],
    references: [households.id],
  }),
  distributedByStaff: one(staff, {
    fields: [aidDistributions.distributedBy],
    references: [staff.id],
  }),
}));

// Relations for permissions
export const permissionsRelations = relations(permissions, ({ many }) => ({
  staffPermissions: many(staffPermissions),
}));

// Relations for staff permissions
export const staffPermissionsRelations = relations(staffPermissions, ({ one }) => ({
  staff: one(staff, {
    fields: [staffPermissions.staffId],
    references: [staff.id],
  }),
  permission: one(permissions, {
    fields: [staffPermissions.permissionId],
    references: [permissions.id],
  }),
  grantedByStaff: one(staff, {
    fields: [staffPermissions.grantedBy],
    references: [staff.id],
  }),
}));

// Application settings table - stores global application configuration
export const appSettings = pgTable(
  "app_settings",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(), // e.g., "admin_header_title"
    value: text("value"), // JSON or plain text value
    description: text("description"), // Human-readable description
    updatedBy: integer("updated_by").references(() => staff.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("app_settings_key_idx").on(table.key),
  ]
);

// AIDS Programs table - stores information about AIDS distribution programs
export const aidsPrograms = pgTable(
  "aids_programs",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // Program name
    description: text("description"), // Program description
    aidType: varchar("aid_type", { length: 100 }).notNull(), // Type of aid being distributed
    status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, active, completed, cancelled
    createdBy: integer("created_by").references(() => staff.id, { onDelete: "set null" }).notNull(), // Admin who created the program
    startDate: timestamp("start_date"), // Program start date
    endDate: timestamp("end_date"), // Program end date
    notes: text("notes"), // Additional notes
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("aids_programs_status_idx").on(table.status),
    index("aids_programs_created_by_idx").on(table.createdBy),
    index("aids_programs_created_at_idx").on(table.createdAt),
  ]
);

// AIDS Program Zones/Villages table - links programs to zones or villages
export const aidsProgramZones = pgTable(
  "aids_program_zones",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id").references(() => aidsPrograms.id, { onDelete: "cascade" }).notNull(),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "cascade" }), // If set, applies to entire zone
    villageId: integer("village_id").references(() => villages.id, { onDelete: "cascade" }), // If set, applies to specific village
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("aids_program_zones_program_idx").on(table.programId),
    index("aids_program_zones_zone_idx").on(table.zoneId),
    index("aids_program_zones_village_idx").on(table.villageId),
  ]
);

// AIDS Program Assignments table - assigns programs to zone leaders and ketua cawangan
export const aidsProgramAssignments = pgTable(
  "aids_program_assignments",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id").references(() => aidsPrograms.id, { onDelete: "cascade" }).notNull(),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "cascade" }).notNull(), // Zone for this assignment
    assignedTo: integer("assigned_to").references(() => staff.id, { onDelete: "cascade" }).notNull(), // Staff member assigned (zone leader or ketua cawangan)
    assignedBy: integer("assigned_by").references(() => staff.id, { onDelete: "set null" }), // Who made the assignment (admin or zone leader)
    assignmentType: varchar("assignment_type", { length: 20 }).default("zone_leader").notNull(), // zone_leader, ketua_cawangan
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, active, completed
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("aids_program_assignments_program_idx").on(table.programId),
    index("aids_program_assignments_zone_idx").on(table.zoneId),
    index("aids_program_assignments_assigned_to_idx").on(table.assignedTo),
    index("aids_program_assignments_status_idx").on(table.status),
  ]
);

// AIDS Distribution Records table - tracks which households received aids in a program
export const aidsDistributionRecords = pgTable(
  "aids_distribution_records",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id").references(() => aidsPrograms.id, { onDelete: "cascade" }).notNull(),
    householdId: integer("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
    markedBy: integer("marked_by").references(() => staff.id, { onDelete: "set null" }).notNull(), // Ketua cawangan who marked this
    markedAt: timestamp("marked_at").defaultNow().notNull(),
    notes: text("notes"), // Optional notes about the distribution
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("aids_distribution_records_program_idx").on(table.programId),
    index("aids_distribution_records_household_idx").on(table.householdId),
    index("aids_distribution_records_marked_by_idx").on(table.markedBy),
    // Unique constraint: a household can only receive aids once per program
    index("aids_distribution_records_program_household_idx").on(table.programId, table.householdId),
  ]
);

// Relations for AIDS programs
export const aidsProgramsRelations = relations(aidsPrograms, ({ one, many }) => ({
  creator: one(staff, {
    fields: [aidsPrograms.createdBy],
    references: [staff.id],
  }),
  programZones: many(aidsProgramZones),
  assignments: many(aidsProgramAssignments),
  distributionRecords: many(aidsDistributionRecords),
}));

// Relations for AIDS program zones
export const aidsProgramZonesRelations = relations(aidsProgramZones, ({ one }) => ({
  program: one(aidsPrograms, {
    fields: [aidsProgramZones.programId],
    references: [aidsPrograms.id],
  }),
  zone: one(zones, {
    fields: [aidsProgramZones.zoneId],
    references: [zones.id],
  }),
  village: one(villages, {
    fields: [aidsProgramZones.villageId],
    references: [villages.id],
  }),
}));

// Relations for AIDS program assignments
export const aidsProgramAssignmentsRelations = relations(aidsProgramAssignments, ({ one }) => ({
  program: one(aidsPrograms, {
    fields: [aidsProgramAssignments.programId],
    references: [aidsPrograms.id],
  }),
  zone: one(zones, {
    fields: [aidsProgramAssignments.zoneId],
    references: [zones.id],
  }),
  assignedToStaff: one(staff, {
    fields: [aidsProgramAssignments.assignedTo],
    references: [staff.id],
  }),
  assignedByStaff: one(staff, {
    fields: [aidsProgramAssignments.assignedBy],
    references: [staff.id],
  }),
}));

// Relations for AIDS distribution records
export const aidsDistributionRecordsRelations = relations(aidsDistributionRecords, ({ one }) => ({
  program: one(aidsPrograms, {
    fields: [aidsDistributionRecords.programId],
    references: [aidsPrograms.id],
  }),
  household: one(households, {
    fields: [aidsDistributionRecords.householdId],
    references: [households.id],
  }),
  markedByStaff: one(staff, {
    fields: [aidsDistributionRecords.markedBy],
    references: [staff.id],
  }),
}));

// SPR Voter Versions table - tracks different election rounds/versions
export const sprVoterVersions = pgTable(
  "spr_voter_versions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // e.g., "GE15", "PRN2023"
    description: text("description"), // Description of this version
    electionDate: timestamp("election_date"), // Election date
    isActive: boolean("is_active").default(false).notNull(), // Only one version should be active at a time
    createdBy: integer("created_by").references(() => staff.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("spr_voter_versions_name_idx").on(table.name),
    index("spr_voter_versions_is_active_idx").on(table.isActive),
  ]
);

// SPR Voters table - stores voter data from SPR Malaysia
export const sprVoters = pgTable(
  "spr_voters",
  {
    id: serial("id").primaryKey(),
    versionId: integer("version_id").references(() => sprVoterVersions.id, { onDelete: "cascade" }).notNull(),
    noSiri: integer("no_siri"), // Serial number
    noKp: varchar("no_kp", { length: 20 }), // IC number (No. Kad Pengenalan)
    noKpLama: varchar("no_kp_lama", { length: 20 }), // Old IC number
    nama: text("nama").notNull(), // Name
    noHp: varchar("no_hp", { length: 20 }), // Phone number
    jantina: varchar("jantina", { length: 1 }), // Gender (P/L)
    tarikhLahir: timestamp("tarikh_lahir"), // Date of birth
    bangsa: text("bangsa"), // Race/ethnicity
    agama: text("agama"), // Religion
    kategoriKaum: text("kategori_kaum"), // Ethnic category
    noRumah: text("no_rumah"), // House number
    alamat: text("alamat"), // Address
    poskod: varchar("poskod", { length: 10 }), // Postcode
    daerah: text("daerah"), // District
    kodLokaliti: varchar("kod_lokaliti", { length: 50 }), // Locality code
    namaParlimen: text("nama_parlimen"), // Parliament name
    namaDun: text("nama_dun"), // DUN name
    namaPdm: text("nama_pdm"), // PDM name
    namaLokaliti: text("nama_lokaliti"), // Locality name
    kategoriUndi: text("kategori_undi"), // Voting category
    namaTm: text("nama_tm"), // Polling station name (Tempat Mengundi)
    masaUndi: text("masa_undi"), // Voting time
    saluran: integer("saluran"), // Channel/stream number
    householdMemberId: integer("household_member_id").references(() => householdMembers.id, { onDelete: "set null" }), // Link to household member if matched
    votingSupportStatus: votingSupportStatusEnum("voting_support_status"), // White: full support, Black: not supporting, Red: not determined
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("spr_voters_version_idx").on(table.versionId),
    index("spr_voters_no_kp_idx").on(table.noKp),
    index("spr_voters_nama_idx").on(table.nama),
    index("spr_voters_kod_lokaliti_idx").on(table.kodLokaliti),
    index("spr_voters_household_member_idx").on(table.householdMemberId),
    index("spr_voters_voting_support_status_idx").on(table.votingSupportStatus),
  ]
);

// Relations for SPR voter versions
export const sprVoterVersionsRelations = relations(sprVoterVersions, ({ one, many }) => ({
  creator: one(staff, {
    fields: [sprVoterVersions.createdBy],
    references: [staff.id],
  }),
  voters: many(sprVoters),
}));

// Relations for SPR voters
export const sprVotersRelations = relations(sprVoters, ({ one }) => ({
  version: one(sprVoterVersions, {
    fields: [sprVoters.versionId],
    references: [sprVoterVersions.id],
  }),
  householdMember: one(householdMembers, {
    fields: [sprVoters.householdMemberId],
    references: [householdMembers.id],
  }),
}));

// Gender table
export const genders = pgTable(
  "genders",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 10 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("genders_name_idx").on(table.name),
    index("genders_code_idx").on(table.code),
  ]
);

// Religion table
export const religions = pgTable(
  "religions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 20 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("religions_name_idx").on(table.name),
    index("religions_code_idx").on(table.code),
  ]
);

// Race table
export const races = pgTable(
  "races",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 20 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("races_name_idx").on(table.name),
    index("races_code_idx").on(table.code),
  ]
);

// District table
export const districts = pgTable(
  "districts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 20 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("districts_name_idx").on(table.name),
    index("districts_code_idx").on(table.code),
  ]
);

// Parliament table
export const parliaments = pgTable(
  "parliaments",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 20 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("parliaments_name_idx").on(table.name),
    index("parliaments_code_idx").on(table.code),
  ]
);

// Locality table
export const localities = pgTable(
  "localities",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: varchar("code", { length: 50 }).unique(),
    parliamentId: integer("parliament_id").references(() => parliaments.id, { onDelete: "set null" }),
    dunId: integer("dun_id").references(() => duns.id, { onDelete: "set null" }),
    districtId: integer("district_id").references(() => districts.id, { onDelete: "set null" }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("localities_name_idx").on(table.name),
    index("localities_code_idx").on(table.code),
    index("localities_parliament_idx").on(table.parliamentId),
    index("localities_dun_idx").on(table.dunId),
    index("localities_district_idx").on(table.districtId),
  ]
);

// Polling Station table
export const pollingStations = pgTable(
  "polling_stations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    code: varchar("code", { length: 50 }),
    localityId: integer("locality_id").references(() => localities.id, { onDelete: "set null" }),
    address: text("address"),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("polling_stations_name_idx").on(table.name),
    index("polling_stations_code_idx").on(table.code),
    index("polling_stations_locality_idx").on(table.localityId),
  ]
);

// Relations for reference data
export const localitiesRelations = relations(localities, ({ one }) => ({
  parliament: one(parliaments, {
    fields: [localities.parliamentId],
    references: [parliaments.id],
  }),
  dun: one(duns, {
    fields: [localities.dunId],
    references: [duns.id],
  }),
  district: one(districts, {
    fields: [localities.districtId],
    references: [districts.id],
  }),
}));

export const pollingStationsRelations = relations(pollingStations, ({ one }) => ({
  locality: one(localities, {
    fields: [pollingStations.localityId],
    references: [localities.id],
  }),
}));

export const parliamentsRelations = relations(parliaments, ({ many }) => ({
  localities: many(localities),
}));

export const districtsRelations = relations(districts, ({ many }) => ({
  localities: many(localities),
}));
