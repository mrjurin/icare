import { relations } from "drizzle-orm/relations";
import { issueStatuses, issues, issueTypes, localities, profiles, staff, roleAssignments, roles, villages, zones, issueFeedback, staffPermissions, permissions, aidsProgramAssignments, aidsPrograms, aidsProgramZones, pollingStations, sprVoterVersions, duns, districts, parliaments, appSettings, households, householdIncome, householdMembers, sprVoters, backups, notifications, issueMedia, issueAssignments, aidDistributions, aidsDistributionRecords, cawangan, membershipApplications, membershipApplicationPreviousParties, memberships, membershipApplicationSprVoters, pageLayouts, contentBlocks, geocodingJobs, parliamentGeocodingJobs, localityGeocodingJobs, auditLogs, blockTranslations, pageVersions } from "./schema";

export const issuesRelations = relations(issues, ({one, many}) => ({
	issueStatus: one(issueStatuses, {
		fields: [issues.issueStatusId],
		references: [issueStatuses.id]
	}),
	issueType: one(issueTypes, {
		fields: [issues.issueTypeId],
		references: [issueTypes.id]
	}),
	locality: one(localities, {
		fields: [issues.localityId],
		references: [localities.id]
	}),
	profile: one(profiles, {
		fields: [issues.reporterId],
		references: [profiles.id]
	}),
	issueFeedbacks: many(issueFeedback),
	issueMedias: many(issueMedia),
	issueAssignments: many(issueAssignments),
}));

export const issueStatusesRelations = relations(issueStatuses, ({many}) => ({
	issues: many(issues),
}));

export const issueTypesRelations = relations(issueTypes, ({many}) => ({
	issues: many(issues),
}));

export const localitiesRelations = relations(localities, ({one, many}) => ({
	issues: many(issues),
	pollingStations: many(pollingStations),
	district: one(districts, {
		fields: [localities.districtId],
		references: [districts.id]
	}),
	dun: one(duns, {
		fields: [localities.dunId],
		references: [duns.id]
	}),
	parliament: one(parliaments, {
		fields: [localities.parliamentId],
		references: [parliaments.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	issues: many(issues),
	issueFeedbacks: many(issueFeedback),
	householdMember: one(householdMembers, {
		fields: [profiles.householdMemberId],
		references: [householdMembers.id]
	}),
	sprVoter: one(sprVoters, {
		fields: [profiles.sprVoterId],
		references: [sprVoters.id]
	}),
	staff: one(staff, {
		fields: [profiles.verifiedBy],
		references: [staff.id]
	}),
	village: one(villages, {
		fields: [profiles.villageId],
		references: [villages.id]
	}),
	zone: one(zones, {
		fields: [profiles.zoneId],
		references: [zones.id]
	}),
	notifications: many(notifications),
	households: many(households),
}));

export const roleAssignmentsRelations = relations(roleAssignments, ({one}) => ({
	staff_appointedBy: one(staff, {
		fields: [roleAssignments.appointedBy],
		references: [staff.id],
		relationName: "roleAssignments_appointedBy_staff_id"
	}),
	role: one(roles, {
		fields: [roleAssignments.roleId],
		references: [roles.id]
	}),
	staff_staffId: one(staff, {
		fields: [roleAssignments.staffId],
		references: [staff.id],
		relationName: "roleAssignments_staffId_staff_id"
	}),
	village: one(villages, {
		fields: [roleAssignments.villageId],
		references: [villages.id]
	}),
	zone: one(zones, {
		fields: [roleAssignments.zoneId],
		references: [zones.id]
	}),
}));

export const staffRelations = relations(staff, ({one, many}) => ({
	roleAssignments_appointedBy: many(roleAssignments, {
		relationName: "roleAssignments_appointedBy_staff_id"
	}),
	roleAssignments_staffId: many(roleAssignments, {
		relationName: "roleAssignments_staffId_staff_id"
	}),
	staffPermissions_grantedBy: many(staffPermissions, {
		relationName: "staffPermissions_grantedBy_staff_id"
	}),
	staffPermissions_staffId: many(staffPermissions, {
		relationName: "staffPermissions_staffId_staff_id"
	}),
	aidsProgramAssignments_assignedBy: many(aidsProgramAssignments, {
		relationName: "aidsProgramAssignments_assignedBy_staff_id"
	}),
	aidsProgramAssignments_assignedTo: many(aidsProgramAssignments, {
		relationName: "aidsProgramAssignments_assignedTo_staff_id"
	}),
	aidsPrograms: many(aidsPrograms),
	zone: one(zones, {
		fields: [staff.zoneId],
		references: [zones.id]
	}),
	sprVoterVersions: many(sprVoterVersions),
	appSettings: many(appSettings),
	profiles: many(profiles),
	backups: many(backups),
	issueAssignments: many(issueAssignments),
	aidDistributions: many(aidDistributions),
	aidsDistributionRecords: many(aidsDistributionRecords),
	membershipApplications_approvedBy: many(membershipApplications, {
		relationName: "membershipApplications_approvedBy_staff_id"
	}),
	membershipApplications_zoneReviewedBy: many(membershipApplications, {
		relationName: "membershipApplications_zoneReviewedBy_staff_id"
	}),
	memberships: many(memberships),
	membershipApplicationSprVoters: many(membershipApplicationSprVoters),
	geocodingJobs: many(geocodingJobs),
	parliamentGeocodingJobs: many(parliamentGeocodingJobs),
	localityGeocodingJobs: many(localityGeocodingJobs),
	auditLogs: many(auditLogs),
	pageLayouts: many(pageLayouts),
	pageVersions: many(pageVersions),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	roleAssignments: many(roleAssignments),
}));

export const villagesRelations = relations(villages, ({one, many}) => ({
	roleAssignments: many(roleAssignments),
	aidsProgramZones: many(aidsProgramZones),
	profiles: many(profiles),
	cawangan: one(cawangan, {
		fields: [villages.cawanganId],
		references: [cawangan.id]
	}),
	zone: one(zones, {
		fields: [villages.zoneId],
		references: [zones.id]
	}),
}));

export const zonesRelations = relations(zones, ({one, many}) => ({
	roleAssignments: many(roleAssignments),
	aidsProgramAssignments: many(aidsProgramAssignments),
	aidsProgramZones: many(aidsProgramZones),
	staff: many(staff),
	dun: one(duns, {
		fields: [zones.dunId],
		references: [duns.id]
	}),
	pollingStation: one(pollingStations, {
		fields: [zones.pollingStationId],
		references: [pollingStations.id]
	}),
	profiles: many(profiles),
	households: many(households),
	villages: many(villages),
	cawangans: many(cawangan),
	membershipApplications: many(membershipApplications),
	memberships: many(memberships),
}));

export const issueFeedbackRelations = relations(issueFeedback, ({one}) => ({
	issue: one(issues, {
		fields: [issueFeedback.issueId],
		references: [issues.id]
	}),
	profile: one(profiles, {
		fields: [issueFeedback.profileId],
		references: [profiles.id]
	}),
}));

export const staffPermissionsRelations = relations(staffPermissions, ({one}) => ({
	staff_grantedBy: one(staff, {
		fields: [staffPermissions.grantedBy],
		references: [staff.id],
		relationName: "staffPermissions_grantedBy_staff_id"
	}),
	permission: one(permissions, {
		fields: [staffPermissions.permissionId],
		references: [permissions.id]
	}),
	staff_staffId: one(staff, {
		fields: [staffPermissions.staffId],
		references: [staff.id],
		relationName: "staffPermissions_staffId_staff_id"
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	staffPermissions: many(staffPermissions),
}));

export const aidsProgramAssignmentsRelations = relations(aidsProgramAssignments, ({one}) => ({
	staff_assignedBy: one(staff, {
		fields: [aidsProgramAssignments.assignedBy],
		references: [staff.id],
		relationName: "aidsProgramAssignments_assignedBy_staff_id"
	}),
	staff_assignedTo: one(staff, {
		fields: [aidsProgramAssignments.assignedTo],
		references: [staff.id],
		relationName: "aidsProgramAssignments_assignedTo_staff_id"
	}),
	aidsProgram: one(aidsPrograms, {
		fields: [aidsProgramAssignments.programId],
		references: [aidsPrograms.id]
	}),
	zone: one(zones, {
		fields: [aidsProgramAssignments.zoneId],
		references: [zones.id]
	}),
}));

export const aidsProgramsRelations = relations(aidsPrograms, ({one, many}) => ({
	aidsProgramAssignments: many(aidsProgramAssignments),
	aidsProgramZones: many(aidsProgramZones),
	staff: one(staff, {
		fields: [aidsPrograms.createdBy],
		references: [staff.id]
	}),
	aidsDistributionRecords: many(aidsDistributionRecords),
}));

export const aidsProgramZonesRelations = relations(aidsProgramZones, ({one}) => ({
	aidsProgram: one(aidsPrograms, {
		fields: [aidsProgramZones.programId],
		references: [aidsPrograms.id]
	}),
	village: one(villages, {
		fields: [aidsProgramZones.villageId],
		references: [villages.id]
	}),
	zone: one(zones, {
		fields: [aidsProgramZones.zoneId],
		references: [zones.id]
	}),
}));

export const pollingStationsRelations = relations(pollingStations, ({one, many}) => ({
	locality: one(localities, {
		fields: [pollingStations.localityId],
		references: [localities.id]
	}),
	zones: many(zones),
}));

export const sprVoterVersionsRelations = relations(sprVoterVersions, ({one, many}) => ({
	staff: one(staff, {
		fields: [sprVoterVersions.createdBy],
		references: [staff.id]
	}),
	sprVoters: many(sprVoters),
	geocodingJobs: many(geocodingJobs),
}));

export const dunsRelations = relations(duns, ({one, many}) => ({
	zones: many(zones),
	localities: many(localities),
	parliament: one(parliaments, {
		fields: [duns.parliamentId],
		references: [parliaments.id]
	}),
}));

export const districtsRelations = relations(districts, ({many}) => ({
	localities: many(localities),
}));

export const parliamentsRelations = relations(parliaments, ({many}) => ({
	localities: many(localities),
	duns: many(duns),
}));

export const appSettingsRelations = relations(appSettings, ({one}) => ({
	staff: one(staff, {
		fields: [appSettings.updatedBy],
		references: [staff.id]
	}),
}));

export const householdIncomeRelations = relations(householdIncome, ({one}) => ({
	household: one(households, {
		fields: [householdIncome.householdId],
		references: [households.id]
	}),
}));

export const householdsRelations = relations(households, ({one, many}) => ({
	householdIncomes: many(householdIncome),
	profile: one(profiles, {
		fields: [households.headOfHouseholdId],
		references: [profiles.id]
	}),
	zone: one(zones, {
		fields: [households.zoneId],
		references: [zones.id]
	}),
	aidDistributions: many(aidDistributions),
	aidsDistributionRecords: many(aidsDistributionRecords),
	householdMembers: many(householdMembers),
}));

export const householdMembersRelations = relations(householdMembers, ({one, many}) => ({
	profiles: many(profiles),
	sprVoters: many(sprVoters),
	household: one(households, {
		fields: [householdMembers.householdId],
		references: [households.id]
	}),
}));

export const sprVotersRelations = relations(sprVoters, ({one, many}) => ({
	profiles: many(profiles),
	householdMember: one(householdMembers, {
		fields: [sprVoters.householdMemberId],
		references: [householdMembers.id]
	}),
	sprVoterVersion: one(sprVoterVersions, {
		fields: [sprVoters.versionId],
		references: [sprVoterVersions.id]
	}),
	membershipApplicationSprVoters: many(membershipApplicationSprVoters),
}));

export const backupsRelations = relations(backups, ({one}) => ({
	staff: one(staff, {
		fields: [backups.createdBy],
		references: [staff.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	profile: one(profiles, {
		fields: [notifications.profileId],
		references: [profiles.id]
	}),
}));

export const issueMediaRelations = relations(issueMedia, ({one}) => ({
	issue: one(issues, {
		fields: [issueMedia.issueId],
		references: [issues.id]
	}),
}));

export const issueAssignmentsRelations = relations(issueAssignments, ({one}) => ({
	issue: one(issues, {
		fields: [issueAssignments.issueId],
		references: [issues.id]
	}),
	staff: one(staff, {
		fields: [issueAssignments.staffId],
		references: [staff.id]
	}),
}));

export const aidDistributionsRelations = relations(aidDistributions, ({one}) => ({
	staff: one(staff, {
		fields: [aidDistributions.distributedBy],
		references: [staff.id]
	}),
	household: one(households, {
		fields: [aidDistributions.householdId],
		references: [households.id]
	}),
}));

export const aidsDistributionRecordsRelations = relations(aidsDistributionRecords, ({one}) => ({
	household: one(households, {
		fields: [aidsDistributionRecords.householdId],
		references: [households.id]
	}),
	staff: one(staff, {
		fields: [aidsDistributionRecords.markedBy],
		references: [staff.id]
	}),
	aidsProgram: one(aidsPrograms, {
		fields: [aidsDistributionRecords.programId],
		references: [aidsPrograms.id]
	}),
}));

export const cawanganRelations = relations(cawangan, ({one, many}) => ({
	villages: many(villages),
	zone: one(zones, {
		fields: [cawangan.zoneId],
		references: [zones.id]
	}),
	membershipApplications: many(membershipApplications),
	memberships: many(memberships),
}));

export const membershipApplicationsRelations = relations(membershipApplications, ({one, many}) => ({
	staff_approvedBy: one(staff, {
		fields: [membershipApplications.approvedBy],
		references: [staff.id],
		relationName: "membershipApplications_approvedBy_staff_id"
	}),
	cawangan: one(cawangan, {
		fields: [membershipApplications.cawanganId],
		references: [cawangan.id]
	}),
	zone: one(zones, {
		fields: [membershipApplications.zoneId],
		references: [zones.id]
	}),
	staff_zoneReviewedBy: one(staff, {
		fields: [membershipApplications.zoneReviewedBy],
		references: [staff.id],
		relationName: "membershipApplications_zoneReviewedBy_staff_id"
	}),
	membershipApplicationPreviousParties: many(membershipApplicationPreviousParties),
	memberships: many(memberships),
	membershipApplicationSprVoters: many(membershipApplicationSprVoters),
}));

export const membershipApplicationPreviousPartiesRelations = relations(membershipApplicationPreviousParties, ({one}) => ({
	membershipApplication: one(membershipApplications, {
		fields: [membershipApplicationPreviousParties.applicationId],
		references: [membershipApplications.id]
	}),
}));

export const membershipsRelations = relations(memberships, ({one}) => ({
	membershipApplication: one(membershipApplications, {
		fields: [memberships.applicationId],
		references: [membershipApplications.id]
	}),
	staff: one(staff, {
		fields: [memberships.approvedBy],
		references: [staff.id]
	}),
	cawangan: one(cawangan, {
		fields: [memberships.cawanganId],
		references: [cawangan.id]
	}),
	zone: one(zones, {
		fields: [memberships.zoneId],
		references: [zones.id]
	}),
}));

export const membershipApplicationSprVotersRelations = relations(membershipApplicationSprVoters, ({one}) => ({
	staff: one(staff, {
		fields: [membershipApplicationSprVoters.linkedBy],
		references: [staff.id]
	}),
	membershipApplication: one(membershipApplications, {
		fields: [membershipApplicationSprVoters.membershipApplicationId],
		references: [membershipApplications.id]
	}),
	sprVoter: one(sprVoters, {
		fields: [membershipApplicationSprVoters.sprVoterId],
		references: [sprVoters.id]
	}),
}));

export const contentBlocksRelations = relations(contentBlocks, ({one, many}) => ({
	pageLayout: one(pageLayouts, {
		fields: [contentBlocks.layoutId],
		references: [pageLayouts.id]
	}),
	blockTranslations: many(blockTranslations),
}));

export const pageLayoutsRelations = relations(pageLayouts, ({one, many}) => ({
	contentBlocks: many(contentBlocks),
	staff: one(staff, {
		fields: [pageLayouts.createdBy],
		references: [staff.id]
	}),
	pageVersions: many(pageVersions),
}));

export const geocodingJobsRelations = relations(geocodingJobs, ({one}) => ({
	staff: one(staff, {
		fields: [geocodingJobs.createdBy],
		references: [staff.id]
	}),
	sprVoterVersion: one(sprVoterVersions, {
		fields: [geocodingJobs.versionId],
		references: [sprVoterVersions.id]
	}),
}));

export const parliamentGeocodingJobsRelations = relations(parliamentGeocodingJobs, ({one}) => ({
	staff: one(staff, {
		fields: [parliamentGeocodingJobs.createdBy],
		references: [staff.id]
	}),
}));

export const localityGeocodingJobsRelations = relations(localityGeocodingJobs, ({one}) => ({
	staff: one(staff, {
		fields: [localityGeocodingJobs.createdBy],
		references: [staff.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	staff: one(staff, {
		fields: [auditLogs.userId],
		references: [staff.id]
	}),
}));

export const blockTranslationsRelations = relations(blockTranslations, ({one}) => ({
	contentBlock: one(contentBlocks, {
		fields: [blockTranslations.blockId],
		references: [contentBlocks.id]
	}),
}));

export const pageVersionsRelations = relations(pageVersions, ({one}) => ({
	staff: one(staff, {
		fields: [pageVersions.createdBy],
		references: [staff.id]
	}),
	pageLayout: one(pageLayouts, {
		fields: [pageVersions.layoutId],
		references: [pageLayouts.id]
	}),
}));