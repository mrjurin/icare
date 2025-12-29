import { pgTable, index, foreignKey, serial, integer, text, doublePrecision, timestamp, varchar, unique, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dependencyStatus = pgEnum("dependency_status", ['dependent', 'independent'])
export const geocodingJobStatus = pgEnum("geocoding_job_status", ['pending', 'running', 'paused', 'completed', 'failed'])
export const issueCategory = pgEnum("issue_category", ['road_maintenance', 'drainage', 'public_safety', 'sanitation', 'other'])
export const issuePriority = pgEnum("issue_priority", ['low', 'medium', 'high', 'critical'])
export const issueStatus = pgEnum("issue_status", ['pending', 'in_progress', 'resolved', 'closed'])
export const memberRelationship = pgEnum("member_relationship", ['head', 'spouse', 'child', 'parent', 'sibling', 'other'])
export const memberStatus = pgEnum("member_status", ['at_home', 'away', 'deceased'])
export const membershipApplicationStatus = pgEnum("membership_application_status", ['draft', 'submitted', 'zone_reviewed', 'approved', 'rejected'])
export const profileVerificationStatus = pgEnum("profile_verification_status", ['pending', 'verified', 'rejected'])
export const staffRole = pgEnum("staff_role", ['adun', 'super_admin', 'zone_leader', 'staff_manager', 'staff'])
export const staffStatus = pgEnum("staff_status", ['active', 'inactive'])
export const votingSupportStatus = pgEnum("voting_support_status", ['white', 'black', 'red'])

export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	fullName: text("full_name"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	email: text(),
	phone: varchar({ length: 20 }),
	address: text(),
	avatarUrl: text("avatar_url"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	icNumber: varchar("ic_number", { length: 20 }),
	villageId: integer("village_id"),
	zoneId: integer("zone_id"),
	householdMemberId: integer("household_member_id"),
	verificationStatus: profileVerificationStatus("verification_status").default('pending').notNull(),
	verifiedBy: integer("verified_by"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verificationRemarks: text("verification_remarks"),
	sprVoterId: integer("spr_voter_id"),
}, (table) => [
	index("profiles_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("profiles_household_member_idx").using("btree", table.householdMemberId.asc().nullsLast().op("int4_ops")),
	index("profiles_ic_number_idx").using("btree", table.icNumber.asc().nullsLast().op("text_ops")),
	index("profiles_spr_voter_idx").using("btree", table.sprVoterId.asc().nullsLast().op("int4_ops")),
	index("profiles_verification_status_idx").using("btree", table.verificationStatus.asc().nullsLast().op("enum_ops")),
	index("profiles_village_idx").using("btree", table.villageId.asc().nullsLast().op("int4_ops")),
	index("profiles_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	// Only include foreign keys for tables defined before this point
	// Other foreign keys will be added later to avoid circular dependencies
]);

export const issues = pgTable("issues", {
	id: serial().primaryKey().notNull(),
	reporterId: integer("reporter_id"),
	title: text().notNull(),
	description: text().notNull(),
	category: issueCategory().default('other').notNull(),
	status: issueStatus().default('pending').notNull(),
	address: text().notNull(),
	lat: doublePrecision(),
	lng: doublePrecision(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	issueTypeId: integer("issue_type_id"),
	localityId: integer("locality_id"),
	priority: issuePriority().default('medium').notNull(),
	issueStatusId: integer("issue_status_id"),
}, (table) => [
	index("issues_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("issues_issue_status_idx").using("btree", table.issueStatusId.asc().nullsLast().op("int4_ops")),
	index("issues_issue_type_idx").using("btree", table.issueTypeId.asc().nullsLast().op("int4_ops")),
	index("issues_locality_idx").using("btree", table.localityId.asc().nullsLast().op("int4_ops")),
	index("issues_priority_idx").using("btree", table.priority.asc().nullsLast().op("enum_ops")),
	index("issues_reporter_idx").using("btree", table.reporterId.asc().nullsLast().op("int4_ops")),
	index("issues_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.issueStatusId],
			foreignColumns: [issueStatuses.id],
			name: "issues_issue_status_id_issue_statuses_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.issueTypeId],
			foreignColumns: [issueTypes.id],
			name: "issues_issue_type_id_issue_types_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.localityId],
			foreignColumns: [localities.id],
			name: "issues_locality_id_localities_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [profiles.id],
			name: "issues_reporter_id_profiles_id_fk"
		}).onDelete("set null"),
]);

export const supportRequests = pgTable("support_requests", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	subject: text().notNull(),
	message: text().notNull(),
	status: varchar({ length: 20 }).default('open').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
}, (table) => [
	index("support_requests_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("support_requests_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const roleAssignments = pgTable("role_assignments", {
	id: serial().primaryKey().notNull(),
	staffId: integer("staff_id").notNull(),
	roleId: integer("role_id").notNull(),
	zoneId: integer("zone_id").notNull(),
	appointedBy: integer("appointed_by"),
	status: varchar({ length: 20 }).default('active').notNull(),
	appointedAt: timestamp("appointed_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	villageId: integer("village_id"),
}, (table) => [
	index("role_assignments_appointed_by_idx").using("btree", table.appointedBy.asc().nullsLast().op("int4_ops")),
	index("role_assignments_role_idx").using("btree", table.roleId.asc().nullsLast().op("int4_ops")),
	index("role_assignments_staff_idx").using("btree", table.staffId.asc().nullsLast().op("int4_ops")),
	index("role_assignments_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("role_assignments_village_idx").using("btree", table.villageId.asc().nullsLast().op("int4_ops")),
	index("role_assignments_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.appointedBy],
			foreignColumns: [staff.id],
			name: "role_assignments_appointed_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_assignments_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "role_assignments_staff_id_staff_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villageId],
			foreignColumns: [villages.id],
			name: "role_assignments_village_id_villages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "role_assignments_zone_id_zones_id_fk"
		}).onDelete("cascade"),
]);

export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: varchar({ length: 16 }).default('general').notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("announcements_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("announcements_published_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
]);

export const issueFeedback = pgTable("issue_feedback", {
	id: serial().primaryKey().notNull(),
	issueId: integer("issue_id").notNull(),
	profileId: integer("profile_id"),
	rating: integer().notNull(),
	comments: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("issue_feedback_issue_idx").using("btree", table.issueId.asc().nullsLast().op("int4_ops")),
	index("issue_feedback_profile_idx").using("btree", table.profileId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.issueId],
			foreignColumns: [issues.id],
			name: "issue_feedback_issue_id_issues_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "issue_feedback_profile_id_profiles_id_fk"
		}).onDelete("set null"),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	responsibilities: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("roles_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const staffPermissions = pgTable("staff_permissions", {
	id: serial().primaryKey().notNull(),
	staffId: integer("staff_id").notNull(),
	permissionId: integer("permission_id").notNull(),
	grantedBy: integer("granted_by"),
	grantedAt: timestamp("granted_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("staff_permissions_granted_by_idx").using("btree", table.grantedBy.asc().nullsLast().op("int4_ops")),
	index("staff_permissions_permission_idx").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	index("staff_permissions_staff_idx").using("btree", table.staffId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [staff.id],
			name: "staff_permissions_granted_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "staff_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "staff_permissions_staff_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 100 }).notNull(),
	name: text().notNull(),
	description: text(),
	category: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("permissions_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("permissions_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
]);

export const aidsProgramAssignments = pgTable("aids_program_assignments", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	zoneId: integer("zone_id").notNull(),
	assignedTo: integer("assigned_to").notNull(),
	assignedBy: integer("assigned_by"),
	assignmentType: varchar("assignment_type", { length: 20 }).default('zone_leader').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aids_program_assignments_assigned_to_idx").using("btree", table.assignedTo.asc().nullsLast().op("int4_ops")),
	index("aids_program_assignments_program_idx").using("btree", table.programId.asc().nullsLast().op("int4_ops")),
	index("aids_program_assignments_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("aids_program_assignments_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [staff.id],
			name: "aids_program_assignments_assigned_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "aids_program_assignments_assigned_to_staff_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [aidsPrograms.id],
			name: "aids_program_assignments_program_id_aids_programs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "aids_program_assignments_zone_id_zones_id_fk"
		}).onDelete("cascade"),
]);

export const aidsProgramZones = pgTable("aids_program_zones", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	zoneId: integer("zone_id"),
	villageId: integer("village_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aids_program_zones_program_idx").using("btree", table.programId.asc().nullsLast().op("int4_ops")),
	index("aids_program_zones_village_idx").using("btree", table.villageId.asc().nullsLast().op("int4_ops")),
	index("aids_program_zones_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [aidsPrograms.id],
			name: "aids_program_zones_program_id_aids_programs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villageId],
			foreignColumns: [villages.id],
			name: "aids_program_zones_village_id_villages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "aids_program_zones_zone_id_zones_id_fk"
		}).onDelete("cascade"),
]);

export const aidsPrograms = pgTable("aids_programs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	aidType: varchar("aid_type", { length: 100 }).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	createdBy: integer("created_by").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aids_programs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("aids_programs_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("aids_programs_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "aids_programs_created_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const priorities = pgTable("priorities", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("priorities_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("priorities_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("priorities_name_unique").on(table.name),
]);

export const staff = pgTable("staff", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text(),
	phone: varchar({ length: 20 }),
	role: staffRole().default('staff').notNull(),
	position: text(),
	status: staffStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	zoneId: integer("zone_id"),
	icNumber: varchar("ic_number", { length: 20 }),
}, (table) => [
	index("staff_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("staff_ic_number_idx").using("btree", table.icNumber.asc().nullsLast().op("text_ops")),
	index("staff_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	index("staff_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("staff_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "staff_zone_id_zones_id_fk"
		}).onDelete("set null"),
]);

export const pollingStations = pgTable("polling_stations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 50 }),
	localityId: integer("locality_id"),
	address: text(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("polling_stations_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("polling_stations_locality_idx").using("btree", table.localityId.asc().nullsLast().op("int4_ops")),
	index("polling_stations_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.localityId],
			foreignColumns: [localities.id],
			name: "polling_stations_locality_id_localities_id_fk"
		}).onDelete("set null"),
	unique("polling_stations_name_unique").on(table.name),
]);

export const issueStatuses = pgTable("issue_statuses", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("issue_statuses_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("issue_statuses_display_order_idx").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("issue_statuses_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("issue_statuses_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("issue_statuses_name_unique").on(table.name),
]);

export const races = pgTable("races", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("races_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("races_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("races_name_unique").on(table.name),
]);

export const religions = pgTable("religions", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("religions_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("religions_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("religions_name_unique").on(table.name),
]);

export const sprVoterVersions = pgTable("spr_voter_versions", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	electionDate: timestamp("election_date", { mode: 'string' }),
	isActive: boolean("is_active").default(false).notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("spr_voter_versions_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("spr_voter_versions_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "spr_voter_versions_created_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const zones = pgTable("zones", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	dunId: integer("dun_id").notNull(),
	pollingStationId: integer("polling_station_id"),
}, (table) => [
	index("zones_dun_idx").using("btree", table.dunId.asc().nullsLast().op("int4_ops")),
	index("zones_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("zones_polling_station_idx").using("btree", table.pollingStationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.dunId],
			foreignColumns: [duns.id],
			name: "zones_dun_id_duns_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pollingStationId],
			foreignColumns: [pollingStations.id],
			name: "zones_polling_station_id_polling_stations_id_fk"
		}).onDelete("set null"),
]);

export const localities = pgTable("localities", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 50 }),
	parliamentId: integer("parliament_id"),
	dunId: integer("dun_id"),
	districtId: integer("district_id"),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lat: doublePrecision(),
	lng: doublePrecision(),
}, (table) => [
	index("localities_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("localities_district_idx").using("btree", table.districtId.asc().nullsLast().op("int4_ops")),
	index("localities_dun_idx").using("btree", table.dunId.asc().nullsLast().op("int4_ops")),
	index("localities_lat_idx").using("btree", table.lat.asc().nullsLast().op("float8_ops")),
	index("localities_lng_idx").using("btree", table.lng.asc().nullsLast().op("float8_ops")),
	index("localities_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("localities_parliament_idx").using("btree", table.parliamentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.districtId],
			foreignColumns: [districts.id],
			name: "localities_district_id_districts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.dunId],
			foreignColumns: [duns.id],
			name: "localities_dun_id_duns_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parliamentId],
			foreignColumns: [parliaments.id],
			name: "localities_parliament_id_parliaments_id_fk"
		}).onDelete("set null"),
	unique("localities_code_unique").on(table.code),
]);

export const parliaments = pgTable("parliaments", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lat: doublePrecision(),
	lng: doublePrecision(),
}, (table) => [
	index("parliaments_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("parliaments_lat_idx").using("btree", table.lat.asc().nullsLast().op("float8_ops")),
	index("parliaments_lng_idx").using("btree", table.lng.asc().nullsLast().op("float8_ops")),
	index("parliaments_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("parliaments_name_unique").on(table.name),
]);

export const appSettings = pgTable("app_settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text(),
	description: text(),
	updatedBy: integer("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("app_settings_key_idx").using("btree", table.key.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [staff.id],
			name: "app_settings_updated_by_staff_id_fk"
		}).onDelete("set null"),
	unique("app_settings_key_unique").on(table.key),
]);

export const householdIncome = pgTable("household_income", {
	id: serial().primaryKey().notNull(),
	householdId: integer("household_id").notNull(),
	monthlyIncome: doublePrecision("monthly_income"),
	incomeSource: text("income_source"),
	numberOfIncomeEarners: integer("number_of_income_earners").default(0).notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("household_income_household_idx").using("btree", table.householdId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "household_income_household_id_households_id_fk"
		}).onDelete("cascade"),
]);

export const genders = pgTable("genders", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 10 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("genders_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("genders_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("genders_name_unique").on(table.name),
]);

export const districts = pgTable("districts", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("districts_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("districts_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("districts_name_unique").on(table.name),
]);

export const backups = pgTable("backups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	fileName: text("file_name").notNull(),
	filePath: text("file_path"),
	fileSize: integer("file_size"),
	backupType: varchar("backup_type", { length: 20 }).default('full').notNull(),
	status: varchar({ length: 20 }).default('completed').notNull(),
	createdBy: integer("created_by"),
	metadata: text(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("backups_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("backups_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("backups_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "backups_created_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	profileId: integer("profile_id").notNull(),
	title: text().notNull(),
	body: text().notNull(),
	category: varchar({ length: 16 }).default('system').notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_profile_idx").using("btree", table.profileId.asc().nullsLast().op("int4_ops")),
	index("notifications_read_idx").using("btree", table.read.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "notifications_profile_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const households = pgTable("households", {
	id: serial().primaryKey().notNull(),
	headOfHouseholdId: integer("head_of_household_id"),
	headName: text("head_name").notNull(),
	headIcNumber: varchar("head_ic_number", { length: 20 }),
	headPhone: varchar("head_phone", { length: 20 }),
	address: text().notNull(),
	area: text(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	zoneId: integer("zone_id"),
}, (table) => [
	index("households_area_idx").using("btree", table.area.asc().nullsLast().op("text_ops")),
	index("households_head_idx").using("btree", table.headOfHouseholdId.asc().nullsLast().op("int4_ops")),
	index("households_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.headOfHouseholdId],
			foreignColumns: [profiles.id],
			name: "households_head_of_household_id_profiles_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "households_zone_id_zones_id_fk"
		}).onDelete("set null"),
]);

export const issueMedia = pgTable("issue_media", {
	id: serial().primaryKey().notNull(),
	issueId: integer("issue_id").notNull(),
	url: text().notNull(),
	type: varchar({ length: 16 }).default('image').notNull(),
	sizeBytes: integer("size_bytes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("issue_media_issue_idx").using("btree", table.issueId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.issueId],
			foreignColumns: [issues.id],
			name: "issue_media_issue_id_issues_id_fk"
		}).onDelete("cascade"),
]);

export const issueAssignments = pgTable("issue_assignments", {
	id: serial().primaryKey().notNull(),
	issueId: integer("issue_id").notNull(),
	status: varchar({ length: 16 }).default('assigned').notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	staffId: integer("staff_id"),
}, (table) => [
	index("issue_assignments_issue_idx").using("btree", table.issueId.asc().nullsLast().op("int4_ops")),
	index("issue_assignments_staff_idx").using("btree", table.staffId.asc().nullsLast().op("int4_ops")),
	index("issue_assignments_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.issueId],
			foreignColumns: [issues.id],
			name: "issue_assignments_issue_id_issues_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "issue_assignments_staff_id_staff_id_fk"
		}).onDelete("set null"),
]);

export const aidDistributions = pgTable("aid_distributions", {
	id: serial().primaryKey().notNull(),
	householdId: integer("household_id").notNull(),
	aidType: varchar("aid_type", { length: 100 }).notNull(),
	quantity: integer().default(1).notNull(),
	distributedTo: integer("distributed_to").notNull(),
	distributedBy: integer("distributed_by"),
	distributionDate: timestamp("distribution_date", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aid_distributions_date_idx").using("btree", table.distributionDate.asc().nullsLast().op("timestamp_ops")),
	index("aid_distributions_household_idx").using("btree", table.householdId.asc().nullsLast().op("int4_ops")),
	index("aid_distributions_type_idx").using("btree", table.aidType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.distributedBy],
			foreignColumns: [staff.id],
			name: "aid_distributions_distributed_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "aid_distributions_household_id_households_id_fk"
		}).onDelete("cascade"),
]);

export const aidsDistributionRecords = pgTable("aids_distribution_records", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	householdId: integer("household_id").notNull(),
	markedBy: integer("marked_by").notNull(),
	markedAt: timestamp("marked_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("aids_distribution_records_household_idx").using("btree", table.householdId.asc().nullsLast().op("int4_ops")),
	index("aids_distribution_records_marked_by_idx").using("btree", table.markedBy.asc().nullsLast().op("int4_ops")),
	index("aids_distribution_records_program_household_idx").using("btree", table.programId.asc().nullsLast().op("int4_ops"), table.householdId.asc().nullsLast().op("int4_ops")),
	index("aids_distribution_records_program_idx").using("btree", table.programId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "aids_distribution_records_household_id_households_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.markedBy],
			foreignColumns: [staff.id],
			name: "aids_distribution_records_marked_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [aidsPrograms.id],
			name: "aids_distribution_records_program_id_aids_programs_id_fk"
		}).onDelete("cascade"),
]);

export const villages = pgTable("villages", {
	id: serial().primaryKey().notNull(),
	zoneId: integer("zone_id"),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	cawanganId: integer("cawangan_id").notNull(),
}, (table) => [
	index("villages_cawangan_idx").using("btree", table.cawanganId.asc().nullsLast().op("int4_ops")),
	index("villages_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("villages_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cawanganId],
			foreignColumns: [cawangan.id],
			name: "villages_cawangan_id_cawangan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "villages_zone_id_zones_id_fk"
		}).onDelete("cascade"),
]);

export const duns = pgTable("duns", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	parliamentId: integer("parliament_id"),
}, (table) => [
	index("duns_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("duns_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("duns_parliament_idx").using("btree", table.parliamentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.parliamentId],
			foreignColumns: [parliaments.id],
			name: "duns_parliament_id_parliaments_id_fk"
		}).onDelete("set null"),
]);

export const cawangan = pgTable("cawangan", {
	id: serial().primaryKey().notNull(),
	zoneId: integer("zone_id").notNull(),
	name: text().notNull(),
	code: varchar({ length: 20 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cawangan_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("cawangan_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("cawangan_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "cawangan_zone_id_zones_id_fk"
		}).onDelete("cascade"),
]);

export const sprVoters = pgTable("spr_voters", {
	id: serial().primaryKey().notNull(),
	versionId: integer("version_id").notNull(),
	noSiri: integer("no_siri"),
	noKp: varchar("no_kp", { length: 20 }),
	noKpLama: varchar("no_kp_lama", { length: 20 }),
	nama: text().notNull(),
	noHp: varchar("no_hp", { length: 20 }),
	jantina: varchar({ length: 1 }),
	tarikhLahir: timestamp("tarikh_lahir", { mode: 'string' }),
	bangsa: text(),
	agama: text(),
	kategoriKaum: text("kategori_kaum"),
	noRumah: text("no_rumah"),
	alamat: text(),
	poskod: varchar({ length: 10 }),
	daerah: text(),
	kodLokaliti: varchar("kod_lokaliti", { length: 50 }),
	namaParlimen: text("nama_parlimen"),
	namaDun: text("nama_dun"),
	namaPdm: text("nama_pdm"),
	namaLokaliti: text("nama_lokaliti"),
	kategoriUndi: text("kategori_undi"),
	namaTm: text("nama_tm"),
	masaUndi: text("masa_undi"),
	saluran: integer(),
	householdMemberId: integer("household_member_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	votingSupportStatus: votingSupportStatus("voting_support_status"),
	lat: doublePrecision(),
	lng: doublePrecision(),
}, (table) => [
	index("spr_voters_household_member_idx").using("btree", table.householdMemberId.asc().nullsLast().op("int4_ops")),
	index("spr_voters_kod_lokaliti_idx").using("btree", table.kodLokaliti.asc().nullsLast().op("text_ops")),
	index("spr_voters_location_idx").using("btree", table.lat.asc().nullsLast().op("float8_ops"), table.lng.asc().nullsLast().op("float8_ops")),
	index("spr_voters_nama_idx").using("btree", table.nama.asc().nullsLast().op("text_ops")),
	index("spr_voters_no_kp_idx").using("btree", table.noKp.asc().nullsLast().op("text_ops")),
	index("spr_voters_version_idx").using("btree", table.versionId.asc().nullsLast().op("int4_ops")),
	index("spr_voters_voting_support_status_idx").using("btree", table.votingSupportStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.householdMemberId],
			foreignColumns: [householdMembers.id],
			name: "spr_voters_household_member_id_household_members_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [sprVoterVersions.id],
			name: "spr_voters_version_id_spr_voter_versions_id_fk"
		}).onDelete("cascade"),
]);

export const membershipApplications = pgTable("membership_applications", {
	id: serial().primaryKey().notNull(),
	zoneId: integer("zone_id").notNull(),
	cawanganId: integer("cawangan_id").notNull(),
	fullName: text("full_name").notNull(),
	icNumber: varchar("ic_number", { length: 20 }).notNull(),
	phone: varchar({ length: 20 }),
	email: text(),
	address: text(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	gender: varchar({ length: 1 }),
	race: text(),
	religion: text(),
	photoUrl: text("photo_url"),
	wasPreviousMember: boolean("was_previous_member").default(false).notNull(),
	zoneReviewedBy: integer("zone_reviewed_by"),
	zoneReviewedAt: timestamp("zone_reviewed_at", { mode: 'string' }),
	zoneSupports: boolean("zone_supports"),
	zoneRemarks: text("zone_remarks"),
	membershipNumber: varchar("membership_number", { length: 50 }),
	approvedBy: integer("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	status: membershipApplicationStatus().default('draft').notNull(),
	adminRemarks: text("admin_remarks"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("membership_applications_cawangan_idx").using("btree", table.cawanganId.asc().nullsLast().op("int4_ops")),
	index("membership_applications_ic_number_idx").using("btree", table.icNumber.asc().nullsLast().op("text_ops")),
	index("membership_applications_membership_number_idx").using("btree", table.membershipNumber.asc().nullsLast().op("text_ops")),
	index("membership_applications_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("membership_applications_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [staff.id],
			name: "membership_applications_approved_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.cawanganId],
			foreignColumns: [cawangan.id],
			name: "membership_applications_cawangan_id_cawangan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "membership_applications_zone_id_zones_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneReviewedBy],
			foreignColumns: [staff.id],
			name: "membership_applications_zone_reviewed_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const membershipApplicationPreviousParties = pgTable("membership_application_previous_parties", {
	id: serial().primaryKey().notNull(),
	applicationId: integer("application_id").notNull(),
	partyName: text("party_name").notNull(),
	fromDate: timestamp("from_date", { mode: 'string' }),
	toDate: timestamp("to_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("membership_app_prev_parties_application_idx").using("btree", table.applicationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [membershipApplications.id],
			name: "membership_application_previous_parties_application_id_membersh"
		}).onDelete("cascade"),
]);

export const memberships = pgTable("memberships", {
	id: serial().primaryKey().notNull(),
	applicationId: integer("application_id"),
	membershipNumber: varchar("membership_number", { length: 50 }).notNull(),
	zoneId: integer("zone_id").notNull(),
	cawanganId: integer("cawangan_id").notNull(),
	fullName: text("full_name").notNull(),
	icNumber: varchar("ic_number", { length: 20 }).notNull(),
	phone: varchar({ length: 20 }),
	email: text(),
	address: text(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	gender: varchar({ length: 1 }),
	race: text(),
	religion: text(),
	photoUrl: text("photo_url"),
	joinedDate: timestamp("joined_date", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	approvedBy: integer("approved_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("memberships_cawangan_idx").using("btree", table.cawanganId.asc().nullsLast().op("int4_ops")),
	index("memberships_ic_number_idx").using("btree", table.icNumber.asc().nullsLast().op("text_ops")),
	index("memberships_membership_number_idx").using("btree", table.membershipNumber.asc().nullsLast().op("text_ops")),
	index("memberships_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("memberships_zone_idx").using("btree", table.zoneId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [membershipApplications.id],
			name: "memberships_application_id_membership_applications_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [staff.id],
			name: "memberships_approved_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.cawanganId],
			foreignColumns: [cawangan.id],
			name: "memberships_cawangan_id_cawangan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.zoneId],
			foreignColumns: [zones.id],
			name: "memberships_zone_id_zones_id_fk"
		}).onDelete("cascade"),
	unique("memberships_membership_number_unique").on(table.membershipNumber),
]);

export const membershipApplicationSprVoters = pgTable("membership_application_spr_voters", {
	id: serial().primaryKey().notNull(),
	membershipApplicationId: integer("membership_application_id").notNull(),
	sprVoterId: integer("spr_voter_id").notNull(),
	linkedBy: integer("linked_by"),
	linkedAt: timestamp("linked_at", { mode: 'string' }).defaultNow().notNull(),
	isAutoLinked: boolean("is_auto_linked").default(false).notNull(),
	notes: text(),
}, (table) => [
	index("membership_application_spr_voters_application_idx").using("btree", table.membershipApplicationId.asc().nullsLast().op("int4_ops")),
	index("membership_application_spr_voters_linked_by_idx").using("btree", table.linkedBy.asc().nullsLast().op("int4_ops")),
	index("membership_application_spr_voters_spr_voter_idx").using("btree", table.sprVoterId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.linkedBy],
			foreignColumns: [staff.id],
			name: "membership_application_spr_voters_linked_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.membershipApplicationId],
			foreignColumns: [membershipApplications.id],
			name: "membership_application_spr_voters_membership_application_id_mem"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sprVoterId],
			foreignColumns: [sprVoters.id],
			name: "membership_application_spr_voters_spr_voter_id_spr_voters_id_fk"
		}).onDelete("cascade"),
	unique("membership_application_spr_voters_unique").on(table.membershipApplicationId, table.sprVoterId),
]);

export const contentBlocks = pgTable("content_blocks", {
	id: serial().primaryKey().notNull(),
	layoutId: integer("layout_id").notNull(),
	blockType: varchar("block_type", { length: 50 }).notNull(),
	blockKey: varchar("block_key", { length: 100 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	isVisible: boolean("is_visible").default(true).notNull(),
	configuration: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("content_blocks_block_type_idx").using("btree", table.blockType.asc().nullsLast().op("text_ops")),
	index("content_blocks_display_order_idx").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("content_blocks_is_visible_idx").using("btree", table.isVisible.asc().nullsLast().op("bool_ops")),
	index("content_blocks_layout_idx").using("btree", table.layoutId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.layoutId],
			foreignColumns: [pageLayouts.id],
			name: "content_blocks_layout_id_page_layouts_id_fk"
		}).onDelete("cascade"),
	unique("content_blocks_layout_key_unique").on(table.layoutId, table.blockKey),
]);

export const issueTypes = pgTable("issue_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: varchar({ length: 50 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("issue_types_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("issue_types_display_order_idx").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("issue_types_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("issue_types_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("issue_types_code_unique").on(table.code),
]);

export const geocodingJobs = pgTable("geocoding_jobs", {
	id: serial().primaryKey().notNull(),
	versionId: integer("version_id").notNull(),
	status: geocodingJobStatus().default('pending').notNull(),
	totalVoters: integer("total_voters").default(0).notNull(),
	processedVoters: integer("processed_voters").default(0).notNull(),
	geocodedCount: integer("geocoded_count").default(0).notNull(),
	failedCount: integer("failed_count").default(0).notNull(),
	skippedCount: integer("skipped_count").default(0).notNull(),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("geocoding_jobs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("geocoding_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("geocoding_jobs_version_idx").using("btree", table.versionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "geocoding_jobs_created_by_staff_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [sprVoterVersions.id],
			name: "geocoding_jobs_version_id_spr_voter_versions_id_fk"
		}).onDelete("cascade"),
]);

export const parliamentGeocodingJobs = pgTable("parliament_geocoding_jobs", {
	id: serial().primaryKey().notNull(),
	status: geocodingJobStatus().default('pending').notNull(),
	totalParliaments: integer("total_parliaments").default(0).notNull(),
	processedParliaments: integer("processed_parliaments").default(0).notNull(),
	geocodedCount: integer("geocoded_count").default(0).notNull(),
	failedCount: integer("failed_count").default(0).notNull(),
	skippedCount: integer("skipped_count").default(0).notNull(),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("parliament_geocoding_jobs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("parliament_geocoding_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "parliament_geocoding_jobs_created_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const localityGeocodingJobs = pgTable("locality_geocoding_jobs", {
	id: serial().primaryKey().notNull(),
	status: geocodingJobStatus().default('pending').notNull(),
	totalLocalities: integer("total_localities").default(0).notNull(),
	processedLocalities: integer("processed_localities").default(0).notNull(),
	geocodedCount: integer("geocoded_count").default(0).notNull(),
	failedCount: integer("failed_count").default(0).notNull(),
	skippedCount: integer("skipped_count").default(0).notNull(),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("locality_geocoding_jobs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("locality_geocoding_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "locality_geocoding_jobs_created_by_staff_id_fk"
		}).onDelete("set null"),
]);

export const householdMembers = pgTable("household_members", {
	id: serial().primaryKey().notNull(),
	householdId: integer("household_id").notNull(),
	name: text().notNull(),
	icNumber: varchar("ic_number", { length: 20 }),
	relationship: memberRelationship().notNull(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	status: memberStatus().default('at_home').notNull(),
	dependencyStatus: dependencyStatus("dependency_status").default('dependent').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	locality: text(),
	votingSupportStatus: votingSupportStatus("voting_support_status"),
	phone: varchar({ length: 20 }),
}, (table) => [
	index("household_members_dependency_idx").using("btree", table.dependencyStatus.asc().nullsLast().op("enum_ops")),
	index("household_members_household_idx").using("btree", table.householdId.asc().nullsLast().op("int4_ops")),
	index("household_members_locality_idx").using("btree", table.locality.asc().nullsLast().op("text_ops")),
	index("household_members_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "household_members_household_id_households_id_fk"
		}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: serial().primaryKey().notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: integer("entity_id"),
	userId: integer("user_id"),
	userEmail: text("user_email"),
	userRole: varchar("user_role", { length: 50 }),
	action: text().notNull(),
	details: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	success: boolean().default(true).notNull(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_logs_entity_composite_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("audit_logs_entity_id_idx").using("btree", table.entityId.asc().nullsLast().op("int4_ops")),
	index("audit_logs_entity_type_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops")),
	index("audit_logs_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("audit_logs_user_email_idx").using("btree", table.userEmail.asc().nullsLast().op("text_ops")),
	index("audit_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [staff.id],
			name: "audit_logs_user_id_staff_id_fk"
		}).onDelete("set null"),
]);

export const blockTranslations = pgTable("block_translations", {
	id: serial().primaryKey().notNull(),
	blockId: integer("block_id").notNull(),
	locale: varchar({ length: 10 }).notNull(),
	content: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("block_translations_block_idx").using("btree", table.blockId.asc().nullsLast().op("int4_ops")),
	index("block_translations_locale_idx").using("btree", table.locale.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.blockId],
			foreignColumns: [contentBlocks.id],
			name: "block_translations_block_id_content_blocks_id_fk"
		}).onDelete("cascade"),
	unique("block_translations_block_locale_unique").on(table.blockId, table.locale),
]);

export const pageLayouts = pgTable("page_layouts", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	pageType: varchar("page_type", { length: 50 }).notNull(),
	route: varchar({ length: 200 }).notNull(),
	title: varchar({ length: 200 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("page_layouts_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("page_layouts_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("page_layouts_is_published_idx").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
	index("page_layouts_page_type_idx").using("btree", table.pageType.asc().nullsLast().op("text_ops")),
	index("page_layouts_route_idx").using("btree", table.route.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "page_layouts_created_by_staff_id_fk"
		}),
	unique("unique_page_route").on(table.route),
]);

export const pageVersions = pgTable("page_versions", {
	id: serial().primaryKey().notNull(),
	layoutId: integer("layout_id").notNull(),
	versionNumber: integer("version_number").notNull(),
	snapshot: text().notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
}, (table) => [
	index("page_versions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("page_versions_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("page_versions_is_published_idx").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
	index("page_versions_layout_idx").using("btree", table.layoutId.asc().nullsLast().op("int4_ops")),
	index("page_versions_version_number_idx").using("btree", table.versionNumber.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "page_versions_created_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.layoutId],
			foreignColumns: [pageLayouts.id],
			name: "page_versions_layout_id_page_layouts_id_fk"
		}).onDelete("cascade"),
	unique("page_versions_layout_version_unique").on(table.layoutId, table.versionNumber),
]);
