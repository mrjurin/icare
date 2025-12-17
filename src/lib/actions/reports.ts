"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getAccessibleZoneIds, getAccessibleZoneIdsReadOnly, getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";
import { isEligibleToVote, calculateAge } from "@/lib/utils/ic-number";
import { getVoterVersions } from "@/lib/actions/spr-voters";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// Voter Analysis Report
export type VoterAnalysisData = {
  total_eligible_voters: number;
  total_households: number;
  voters_by_zone: Array<{
    zone_id: number;
    zone_name: string;
    eligible_voters: number;
    households: number;
    voters_per_household: number;
  }>;
  voters_by_locality: Array<{
    locality: string;
    count: number;
    percentage: number;
  }>;
  age_distribution: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
};

export async function getVoterAnalysisReport(): Promise<ActionResult<VoterAnalysisData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {
        total_eligible_voters: 0,
        total_households: 0,
        voters_by_zone: [],
        voters_by_locality: [],
        age_distribution: [],
      } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);
  if (householdIds.length === 0) {
    return { success: true, data: {
      total_eligible_voters: 0,
      total_households: 0,
      voters_by_zone: zones.map(z => ({
        zone_id: z.id,
        zone_name: z.name,
        eligible_voters: 0,
        households: 0,
        voters_per_household: 0,
      })),
      voters_by_locality: [],
      age_distribution: [],
    } };
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth, locality")
    .in("household_id", householdIds);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Calculate statistics
  const eligibleVoters = (members || []).filter(m => isEligibleToVote(m.date_of_birth));
  const totalEligibleVoters = eligibleVoters.length;
  const totalHouseholds = households?.length || 0;

  // Voters by zone
  const votersByZone = zones.map(zone => {
    const zoneHouseholdIds = (households || [])
      .filter(h => h.zone_id === zone.id)
      .map(h => h.id);
    const zoneMembers = (members || []).filter(m => zoneHouseholdIds.includes(m.household_id));
    const zoneVoters = zoneMembers.filter(m => isEligibleToVote(m.date_of_birth));
    const zoneHouseholds = zoneHouseholdIds.length;
    
    return {
      zone_id: zone.id,
      zone_name: zone.name,
      eligible_voters: zoneVoters.length,
      households: zoneHouseholds,
      voters_per_household: zoneHouseholds > 0 ? Number((zoneVoters.length / zoneHouseholds).toFixed(2)) : 0,
    };
  });

  // Voters by locality
  const localityMap = new Map<string, number>();
  eligibleVoters.forEach(voter => {
    const locality = voter.locality || "Not Specified";
    localityMap.set(locality, (localityMap.get(locality) || 0) + 1);
  });

  const votersByLocality = Array.from(localityMap.entries())
    .map(([locality, count]) => ({
      locality,
      count,
      percentage: totalEligibleVoters > 0 ? Number(((count / totalEligibleVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Age distribution
  const ageGroups = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56-65": 0,
    "65+": 0,
  };

  eligibleVoters.forEach(voter => {
    const age = calculateAge(voter.date_of_birth);
    if (age !== null) {
      if (age >= 18 && age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 45) ageGroups["36-45"]++;
      else if (age <= 55) ageGroups["46-55"]++;
      else if (age <= 65) ageGroups["56-65"]++;
      else ageGroups["65+"]++;
    }
  });

  const ageDistribution = Object.entries(ageGroups)
    .map(([age_group, count]) => ({
      age_group,
      count,
      percentage: totalEligibleVoters > 0 ? Number(((count / totalEligibleVoters) * 100).toFixed(2)) : 0,
    }))
    .filter(item => item.count > 0);

  return {
    success: true,
    data: {
      total_eligible_voters: totalEligibleVoters,
      total_households: totalHouseholds,
      voters_by_zone: votersByZone,
      voters_by_locality: votersByLocality,
      age_distribution: ageDistribution,
    },
  };
}

// Support Level Report
export type SupportLevelData = {
  zones: Array<{
    zone_id: number;
    zone_name: string;
    total_eligible_voters: number;
    white_supporters: number; // Full support
    black_non_supporters: number; // Not supporting
    red_undetermined: number; // Not determined
    unclassified: number; // No status set
    support_score: number; // 0-100 based on white/(white+black+red) ratio
    support_percentage: number; // Percentage of white supporters
  }>;
  overall_support_score: number;
  total_eligible_voters: number;
  total_white_supporters: number;
  total_black_non_supporters: number;
  total_red_undetermined: number;
  total_unclassified: number;
};

export async function getSupportLevelReport(): Promise<ActionResult<SupportLevelData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {
        zones: [],
        overall_support_score: 0,
        total_eligible_voters: 0,
        total_white_supporters: 0,
        total_black_non_supporters: 0,
        total_red_undetermined: 0,
        total_unclassified: 0,
      } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  if (householdIds.length === 0) {
    return { success: true, data: {
      zones: zones.map(z => ({
        zone_id: z.id,
        zone_name: z.name,
        total_eligible_voters: 0,
        white_supporters: 0,
        black_non_supporters: 0,
        red_undetermined: 0,
        unclassified: 0,
        support_score: 0,
        support_percentage: 0,
      })),
      overall_support_score: 0,
      total_eligible_voters: 0,
      total_white_supporters: 0,
      total_black_non_supporters: 0,
      total_red_undetermined: 0,
      total_unclassified: 0,
    } };
  }

  // Get all members with voting support status
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth, voting_support_status")
    .in("household_id", householdIds);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Import utility functions
  const { isEligibleToVote } = await import("@/lib/utils/ic-number");

  // Filter to eligible voters only
  const eligibleVoters = (members || []).filter(m => isEligibleToVote(m.date_of_birth));

  // Calculate per zone
  const zoneStats = zones.map(zone => {
    const zoneHouseholdIds = (households || [])
      .filter(h => h.zone_id === zone.id)
      .map(h => h.id);
    
    const zoneEligibleVoters = eligibleVoters.filter(m => zoneHouseholdIds.includes(m.household_id));
    
    const whiteSupporters = zoneEligibleVoters.filter(v => v.voting_support_status === "white").length;
    const blackNonSupporters = zoneEligibleVoters.filter(v => v.voting_support_status === "black").length;
    const redUndetermined = zoneEligibleVoters.filter(v => v.voting_support_status === "red").length;
    const unclassified = zoneEligibleVoters.filter(v => !v.voting_support_status).length;
    const totalEligibleVoters = zoneEligibleVoters.length;

    // Support score: (white / (white + black + red)) * 100
    // Only count voters with a status (white, black, or red), exclude unclassified
    const classifiedVoters = whiteSupporters + blackNonSupporters + redUndetermined;
    const supportScore = classifiedVoters > 0
      ? Number(((whiteSupporters / classifiedVoters) * 100).toFixed(2))
      : 0;

    // Support percentage: white / total eligible voters
    const supportPercentage = totalEligibleVoters > 0
      ? Number(((whiteSupporters / totalEligibleVoters) * 100).toFixed(2))
      : 0;

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      total_eligible_voters: totalEligibleVoters,
      white_supporters: whiteSupporters,
      black_non_supporters: blackNonSupporters,
      red_undetermined: redUndetermined,
      unclassified: unclassified,
      support_score: supportScore,
      support_percentage: supportPercentage,
    };
  });

  // Calculate overall totals
  const totalEligibleVoters = eligibleVoters.length;
  const totalWhiteSupporters = eligibleVoters.filter(v => v.voting_support_status === "white").length;
  const totalBlackNonSupporters = eligibleVoters.filter(v => v.voting_support_status === "black").length;
  const totalRedUndetermined = eligibleVoters.filter(v => v.voting_support_status === "red").length;
  const totalUnclassified = eligibleVoters.filter(v => !v.voting_support_status).length;

  // Overall support score: average of zone support scores
  const overallSupportScore = zoneStats.length > 0
    ? Number((zoneStats.reduce((sum, z) => sum + z.support_score, 0) / zoneStats.length).toFixed(2))
    : 0;

  return {
    success: true,
    data: {
      zones: zoneStats,
      overall_support_score: overallSupportScore,
      total_eligible_voters: totalEligibleVoters,
      total_white_supporters: totalWhiteSupporters,
      total_black_non_supporters: totalBlackNonSupporters,
      total_red_undetermined: totalRedUndetermined,
      total_unclassified: totalUnclassified,
    },
  };
}

// Zone Performance Report
export type ZonePerformanceData = {
  zones: Array<{
    zone_id: number;
    zone_name: string;
    total_households: number;
    total_people: number;
    eligible_voters: number;
    issues_total: number;
    issues_resolved: number;
    issues_pending: number;
    resolution_rate: number;
    aid_distributions: number;
    coverage_rate: number; // percentage of households covered
  }>;
};

export async function getZonePerformanceReport(): Promise<ActionResult<ZonePerformanceData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: { zones: [] } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  // Get members
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Get issues
  const { data: issues, error: issuesError } = await supabase
    .from("issues")
    .select("id, status");

  if (issuesError) {
    return { success: false, error: issuesError.message };
  }

  // Get aid distributions
  const { data: aidDistributions, error: aidError } = await supabase
    .from("aid_distributions")
    .select("household_id")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (aidError) {
    return { success: false, error: aidError.message };
  }

  // Calculate per zone
  const zoneStats = zones.map(zone => {
    const zoneHouseholdIds = (households || [])
      .filter(h => h.zone_id === zone.id)
      .map(h => h.id);
    
    const totalHouseholds = zoneHouseholdIds.length;
    const zoneMembers = (members || []).filter(m => zoneHouseholdIds.includes(m.household_id));
    const eligibleVoters = zoneMembers.filter(m => isEligibleToVote(m.date_of_birth)).length;

    // Issues (simplified - can be enhanced to link issues to zones)
    const issuesTotal = issues?.length || 0;
    const issuesResolved = (issues || []).filter(i => i.status === "resolved").length;
    const issuesPending = (issues || []).filter(i => i.status === "pending" || i.status === "in_progress").length;
    const resolutionRate = issuesTotal > 0 ? Number(((issuesResolved / issuesTotal) * 100).toFixed(2)) : 0;

    // Aid distributions
    const aidCount = (aidDistributions || []).filter(a => zoneHouseholdIds.includes(a.household_id)).length;
    const coverageRate = totalHouseholds > 0 ? Number(((aidCount / totalHouseholds) * 100).toFixed(2)) : 0;

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      total_households: totalHouseholds,
      total_people: zoneMembers.length,
      eligible_voters: eligibleVoters,
      issues_total: issuesTotal,
      issues_resolved: issuesResolved,
      issues_pending: issuesPending,
      resolution_rate: resolutionRate,
      aid_distributions: aidCount,
      coverage_rate: coverageRate,
    };
  });

  return { success: true, data: { zones: zoneStats } };
}

// Demographic Report
export type DemographicData = {
  total_people: number;
  total_households: number;
  age_distribution: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  dependency_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  income_distribution: Array<{
    income_range: string;
    count: number;
    percentage: number;
  }>;
};

export async function getDemographicReport(): Promise<ActionResult<DemographicData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {
        total_people: 0,
        total_households: 0,
        age_distribution: [],
        dependency_status: [],
        income_distribution: [],
      } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  // Get members
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, date_of_birth, dependency_status")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Get income data
  const { data: incomeData, error: incomeError } = await supabase
    .from("household_income")
    .select("monthly_income")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (incomeError) {
    return { success: false, error: incomeError.message };
  }

  const totalPeople = members?.length || 0;
  const totalHouseholds = households?.length || 0;

  // Age distribution
  const ageGroups = {
    "0-17": 0,
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56-65": 0,
    "65+": 0,
  };

  (members || []).forEach(member => {
    const age = calculateAge(member.date_of_birth);
    if (age !== null) {
      if (age < 18) ageGroups["0-17"]++;
      else if (age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 45) ageGroups["36-45"]++;
      else if (age <= 55) ageGroups["46-55"]++;
      else if (age <= 65) ageGroups["56-65"]++;
      else ageGroups["65+"]++;
    }
  });

  const ageDistribution = Object.entries(ageGroups)
    .map(([age_group, count]) => ({
      age_group,
      count,
      percentage: totalPeople > 0 ? Number(((count / totalPeople) * 100).toFixed(2)) : 0,
    }))
    .filter(item => item.count > 0);

  // Dependency status
  const dependencyMap = new Map<string, number>();
  (members || []).forEach(member => {
    const status = member.dependency_status || "dependent";
    dependencyMap.set(status, (dependencyMap.get(status) || 0) + 1);
  });

  const dependencyStatus = Array.from(dependencyMap.entries())
    .map(([status, count]) => ({
      status: status === "dependent" ? "Dependent" : "Independent",
      count,
      percentage: totalPeople > 0 ? Number(((count / totalPeople) * 100).toFixed(2)) : 0,
    }));

  // Income distribution
  const incomeRanges = {
    "Below RM 1,000": 0,
    "RM 1,000 - RM 2,000": 0,
    "RM 2,000 - RM 3,000": 0,
    "RM 3,000 - RM 5,000": 0,
    "RM 5,000 - RM 10,000": 0,
    "Above RM 10,000": 0,
    "Not Specified": 0,
  };

  (incomeData || []).forEach(income => {
    const monthlyIncome = income.monthly_income;
    if (!monthlyIncome) {
      incomeRanges["Not Specified"]++;
    } else if (monthlyIncome < 1000) {
      incomeRanges["Below RM 1,000"]++;
    } else if (monthlyIncome < 2000) {
      incomeRanges["RM 1,000 - RM 2,000"]++;
    } else if (monthlyIncome < 3000) {
      incomeRanges["RM 2,000 - RM 3,000"]++;
    } else if (monthlyIncome < 5000) {
      incomeRanges["RM 3,000 - RM 5,000"]++;
    } else if (monthlyIncome < 10000) {
      incomeRanges["RM 5,000 - RM 10,000"]++;
    } else {
      incomeRanges["Above RM 10,000"]++;
    }
  });

  const incomeDistribution = Object.entries(incomeRanges)
    .map(([income_range, count]) => ({
      income_range,
      count,
      percentage: totalHouseholds > 0 ? Number(((count / totalHouseholds) * 100).toFixed(2)) : 0,
    }))
    .filter(item => item.count > 0);

  return {
    success: true,
    data: {
      total_people: totalPeople,
      total_households: totalHouseholds,
      age_distribution: ageDistribution,
      dependency_status: dependencyStatus,
      income_distribution: incomeDistribution,
    },
  };
}

// Issue Resolution Report
export type IssueResolutionData = {
  total_issues: number;
  resolved_issues: number;
  pending_issues: number;
  in_progress_issues: number;
  closed_issues: number;
  resolution_rate: number;
  average_resolution_time_days: number;
  issues_by_category: Array<{
    category: string;
    total: number;
    resolved: number;
    resolution_rate: number;
  }>;
  issues_by_zone: Array<{
    zone_name: string;
    total: number;
    resolved: number;
    resolution_rate: number;
  }>;
  issues_by_priority: Array<{
    priority: string;
    total: number;
    resolved: number;
    resolution_rate: number;
  }>;
};

export async function getIssueResolutionReport(): Promise<ActionResult<IssueResolutionData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones first
  let zonesQuery = supabase.from("zones").select("id, name, dun_id");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {
        total_issues: 0,
        resolved_issues: 0,
        pending_issues: 0,
        in_progress_issues: 0,
        closed_issues: 0,
        resolution_rate: 0,
        average_resolution_time_days: 0,
        issues_by_category: [],
        issues_by_zone: [],
        issues_by_priority: [],
      } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);
  const zoneMap = new Map(zones.map(z => [z.id, z.name]));
  const dunIds = [...new Set(zones.map(z => z.dun_id).filter(Boolean))];

  // Get localities to map to zones
  let localitiesQuery = supabase.from("localities").select("id, dun_id");
  if (dunIds.length > 0) {
    localitiesQuery = localitiesQuery.in("dun_id", dunIds);
  }
  const { data: localities, error: localitiesError } = await localitiesQuery;

  if (localitiesError) {
    return { success: false, error: localitiesError.message };
  }

  // Get locality IDs that belong to accessible zones
  const accessibleLocalityIds = (localities || [])
    .filter(l => l.dun_id && dunIds.includes(l.dun_id))
    .map(l => l.id);

  // Get all issue types for mapping
  const { data: issueTypes, error: issueTypesError } = await supabase
    .from("issue_types")
    .select("id, name, code");

  if (issueTypesError) {
    return { success: false, error: issueTypesError.message };
  }

  // Create a map from issue_type_id to issue type name
  const issueTypeMap = new Map<number, string>();
  (issueTypes || []).forEach(it => {
    if (it.id) {
      issueTypeMap.set(it.id, it.name);
    }
  });

  // Get issues - filter by accessible localities if we have zone restrictions
  let issuesQuery = supabase
    .from("issues")
    .select("id, status, category, issue_type_id, priority, created_at, resolved_at, locality_id");

  if (accessibleZoneIds !== null && accessibleLocalityIds.length > 0) {
    // Filter by accessible localities
    issuesQuery = issuesQuery.in("locality_id", accessibleLocalityIds);
  } else if (accessibleZoneIds !== null && accessibleLocalityIds.length === 0) {
    // No accessible localities, return empty data
    return { success: true, data: {
      total_issues: 0,
      resolved_issues: 0,
      pending_issues: 0,
      in_progress_issues: 0,
      closed_issues: 0,
      resolution_rate: 0,
      average_resolution_time_days: 0,
      issues_by_category: [],
      issues_by_zone: [],
      issues_by_priority: [],
    } };
  }

  const { data: issues, error: issuesError } = await issuesQuery;

  if (issuesError) {
    return { success: false, error: issuesError.message };
  }

  // Create a map from locality_id to dun_id, then to zone
  const localityToDunMap = new Map((localities || []).map(l => [l.id, l.dun_id]));
  const dunToZonesMap = new Map<number, number[]>();
  zones.forEach(zone => {
    if (zone.dun_id) {
      const existing = dunToZonesMap.get(zone.dun_id) || [];
      existing.push(zone.id);
      dunToZonesMap.set(zone.dun_id, existing);
    }
  });

  // Map issues to zones
  const issueZoneMap = new Map<number, number>(); // issue_id -> zone_id
  (issues || []).forEach(issue => {
    if (issue.locality_id) {
      const dunId = localityToDunMap.get(issue.locality_id);
      if (dunId) {
        const zoneIdsForDun = dunToZonesMap.get(dunId) || [];
        // For now, assign to first zone in the DUN (could be enhanced to distribute evenly)
        if (zoneIdsForDun.length > 0) {
          issueZoneMap.set(issue.id, zoneIdsForDun[0]);
        }
      }
    }
    // Note: Issues without locality_id are not included in zone breakdown
    // but are still counted in overall totals
  });

  const totalIssues = issues?.length || 0;
  const resolvedIssues = (issues || []).filter(i => i.status === "resolved").length;
  const pendingIssues = (issues || []).filter(i => i.status === "pending").length;
  const inProgressIssues = (issues || []).filter(i => i.status === "in_progress").length;
  const closedIssues = (issues || []).filter(i => i.status === "closed").length;
  const resolutionRate = totalIssues > 0 ? Number(((resolvedIssues / totalIssues) * 100).toFixed(2)) : 0;

  // Calculate average resolution time
  const resolvedWithDates = (issues || [])
    .filter(i => i.status === "resolved" && i.created_at && i.resolved_at);
  
  let avgResolutionTime = 0;
  if (resolvedWithDates.length > 0) {
    const totalDays = resolvedWithDates.reduce((sum, issue) => {
      const created = new Date(issue.created_at);
      const resolved = new Date(issue.resolved_at!);
      const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    avgResolutionTime = Number((totalDays / resolvedWithDates.length).toFixed(1));
  }

  // Issues by category (using issue type name from issue_types table)
  const categoryMap = new Map<string, { total: number; resolved: number }>();
  (issues || []).forEach(issue => {
    // Use issue type name if available, otherwise fallback to category enum
    let categoryName: string;
    if (issue.issue_type_id && issueTypeMap.has(issue.issue_type_id)) {
      categoryName = issueTypeMap.get(issue.issue_type_id)!;
    } else {
      // Fallback to category enum, formatted nicely
      const category = issue.category || "other";
      categoryName = category.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    
    const current = categoryMap.get(categoryName) || { total: 0, resolved: 0 };
    current.total++;
    if (issue.status === "resolved") current.resolved++;
    categoryMap.set(categoryName, current);
  });

  const issuesByCategory = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category: category,
      total: stats.total,
      resolved: stats.resolved,
      resolution_rate: stats.total > 0 ? Number(((stats.resolved / stats.total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Issues by zone
  const zoneStatsMap = new Map<number, { total: number; resolved: number }>();
  (issues || []).forEach(issue => {
    const zoneId = issueZoneMap.get(issue.id);
    if (zoneId) {
      const current = zoneStatsMap.get(zoneId) || { total: 0, resolved: 0 };
      current.total++;
      if (issue.status === "resolved") current.resolved++;
      zoneStatsMap.set(zoneId, current);
    }
  });

  const issuesByZone = Array.from(zoneStatsMap.entries())
    .map(([zoneId, stats]) => ({
      zone_name: zoneMap.get(zoneId) || `Zone ${zoneId}`,
      total: stats.total,
      resolved: stats.resolved,
      resolution_rate: stats.total > 0 ? Number(((stats.resolved / stats.total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Issues by priority
  const priorityMap = new Map<string, { total: number; resolved: number }>();
  (issues || []).forEach(issue => {
    const priority = issue.priority || "medium";
    const priorityName = priority.charAt(0).toUpperCase() + priority.slice(1);
    const current = priorityMap.get(priorityName) || { total: 0, resolved: 0 };
    current.total++;
    if (issue.status === "resolved") current.resolved++;
    priorityMap.set(priorityName, current);
  });

  // Define priority order for sorting
  const priorityOrder: Record<string, number> = {
    "Critical": 0,
    "High": 1,
    "Medium": 2,
    "Low": 3,
  };

  const issuesByPriority = Array.from(priorityMap.entries())
    .map(([priority, stats]) => ({
      priority: priority,
      total: stats.total,
      resolved: stats.resolved,
      resolution_rate: stats.total > 0 ? Number(((stats.resolved / stats.total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => {
      const orderA = priorityOrder[a.priority] ?? 999;
      const orderB = priorityOrder[b.priority] ?? 999;
      return orderA - orderB;
    });

  return {
    success: true,
    data: {
      total_issues: totalIssues,
      resolved_issues: resolvedIssues,
      pending_issues: pendingIssues,
      in_progress_issues: inProgressIssues,
      closed_issues: closedIssues,
      resolution_rate: resolutionRate,
      average_resolution_time_days: avgResolutionTime,
      issues_by_category: issuesByCategory,
      issues_by_zone: issuesByZone,
      issues_by_priority: issuesByPriority,
    },
  };
}

// Aid Distribution Report
export type AidDistributionData = {
  total_distributions: number;
  total_households_served: number;
  total_people_served: number;
  distributions_by_type: Array<{
    aid_type: string;
    count: number;
    quantity: number;
    people_served: number;
  }>;
  distributions_by_zone: Array<{
    zone_name: string;
    distributions: number;
    households_served: number;
    people_served: number;
  }>;
  monthly_trend: Array<{
    month: string;
    distributions: number;
    households_served: number;
  }>;
};

export async function getAidDistributionReport(): Promise<ActionResult<AidDistributionData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {
        total_distributions: 0,
        total_households_served: 0,
        total_people_served: 0,
        distributions_by_type: [],
        distributions_by_zone: [],
        monthly_trend: [],
      } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  // Get aid distributions
  const { data: distributions, error: distributionsError } = await supabase
    .from("aid_distributions")
    .select("id, household_id, aid_type, quantity, distributed_to, distribution_date")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1])
    .order("distribution_date", { ascending: false });

  if (distributionsError) {
    return { success: false, error: distributionsError.message };
  }

  const totalDistributions = distributions?.length || 0;
  const householdsServed = new Set((distributions || []).map(d => d.household_id)).size;
  const totalPeopleServed = (distributions || []).reduce((sum, d) => sum + (d.distributed_to || 0), 0);

  // Distributions by type
  const typeMap = new Map<string, { count: number; quantity: number; people_served: number }>();
  (distributions || []).forEach(dist => {
    const type = dist.aid_type || "Unknown";
    const current = typeMap.get(type) || { count: 0, quantity: 0, people_served: 0 };
    current.count++;
    current.quantity += dist.quantity || 0;
    current.people_served += dist.distributed_to || 0;
    typeMap.set(type, current);
  });

  const distributionsByType = Array.from(typeMap.entries())
    .map(([aid_type, stats]) => ({
      aid_type,
      count: stats.count,
      quantity: stats.quantity,
      people_served: stats.people_served,
    }))
    .sort((a, b) => b.count - a.count);

  // Distributions by zone
  const zoneMap = new Map<number, { distributions: number; households: Set<number>; people_served: number }>();
  (distributions || []).forEach(dist => {
    const household = (households || []).find(h => h.id === dist.household_id);
    if (household) {
      const zoneId = household.zone_id;
      if (zoneId) {
        const current = zoneMap.get(zoneId) || { distributions: 0, households: new Set(), people_served: 0 };
        current.distributions++;
        current.households.add(dist.household_id);
        current.people_served += dist.distributed_to || 0;
        zoneMap.set(zoneId, current);
      }
    }
  });

  const distributionsByZone = Array.from(zoneMap.entries())
    .map(([zoneId, stats]) => {
      const zone = zones.find(z => z.id === zoneId);
      return {
        zone_name: zone?.name || "Unknown",
        distributions: stats.distributions,
        households_served: stats.households.size,
        people_served: stats.people_served,
      };
    })
    .sort((a, b) => b.distributions - a.distributions);

  // Monthly trend (last 12 months)
  const monthlyMap = new Map<string, { distributions: number; households: Set<number> }>();
  (distributions || []).forEach(dist => {
    if (dist.distribution_date) {
      const date = new Date(dist.distribution_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyMap.get(monthKey) || { distributions: 0, households: new Set() };
      current.distributions++;
      current.households.add(dist.household_id);
      monthlyMap.set(monthKey, current);
    }
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, stats]) => ({
      month,
      distributions: stats.distributions,
      households_served: stats.households.size,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  return {
    success: true,
    data: {
      total_distributions: totalDistributions,
      total_households_served: householdsServed,
      total_people_served: totalPeopleServed,
      distributions_by_type: distributionsByType,
      distributions_by_zone: distributionsByZone,
      monthly_trend: monthlyTrend,
    },
  };
}

// Zone Level Report
export type ZoneLevelData = {
  zones: Array<{
    zone_id: number;
    zone_name: string;
    total_households: number;
    total_people: number;
    total_eligible_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
    total_issues: number;
    resolved_issues: number;
    pending_issues: number;
    resolution_rate: number;
    aid_distributions: number;
    villages_count: number;
  }>;
  summary: {
    total_zones: number;
    total_households: number;
    total_eligible_voters: number;
    overall_support_score: number;
    overall_resolution_rate: number;
  };
};

export async function getZoneLevelReport(): Promise<ActionResult<ZoneLevelData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: { zones: [], summary: {
        total_zones: 0,
        total_households: 0,
        total_eligible_voters: 0,
        overall_support_score: 0,
        overall_resolution_rate: 0,
      } } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);

  // Get households
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  // Get members
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth, voting_support_status")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Get issues
  const { data: issues, error: issuesError } = await supabase
    .from("issues")
    .select("id, status");

  if (issuesError) {
    return { success: false, error: issuesError.message };
  }

  // Get aid distributions
  const { data: aidDistributions, error: aidError } = await supabase
    .from("aid_distributions")
    .select("household_id")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (aidError) {
    return { success: false, error: aidError.message };
  }

  // Get village counts
  const { data: villages, error: villagesError } = await supabase
    .from("villages")
    .select("zone_id")
    .in("zone_id", zoneIds);

  if (villagesError) {
    return { success: false, error: villagesError.message };
  }

  // Import utility functions
  const { isEligibleToVote } = await import("@/lib/utils/ic-number");

  // Calculate per zone
  const zoneStats = zones.map(zone => {
    const zoneHouseholdIds = (households || [])
      .filter(h => h.zone_id === zone.id)
      .map(h => h.id);
    
    const zoneMembers = (members || []).filter(m => zoneHouseholdIds.includes(m.household_id));
    const eligibleVoters = zoneMembers.filter(m => isEligibleToVote(m.date_of_birth));
    
    const whiteSupporters = eligibleVoters.filter(v => v.voting_support_status === "white").length;
    const blackNonSupporters = eligibleVoters.filter(v => v.voting_support_status === "black").length;
    const redUndetermined = eligibleVoters.filter(v => v.voting_support_status === "red").length;
    const unclassified = eligibleVoters.filter(v => !v.voting_support_status).length;
    
    const classifiedVoters = whiteSupporters + blackNonSupporters + redUndetermined;
    const supportScore = classifiedVoters > 0
      ? Number(((whiteSupporters / classifiedVoters) * 100).toFixed(2))
      : 0;

    // Issues (simplified - can be enhanced)
    const issuesTotal = issues?.length || 0;
    const issuesResolved = (issues || []).filter(i => i.status === "resolved").length;
    const issuesPending = (issues || []).filter(i => i.status === "pending" || i.status === "in_progress").length;
    const resolutionRate = issuesTotal > 0 ? Number(((issuesResolved / issuesTotal) * 100).toFixed(2)) : 0;

    // Aid distributions
    const aidCount = (aidDistributions || []).filter(a => zoneHouseholdIds.includes(a.household_id)).length;

    // Village count
    const villagesCount = (villages || []).filter(v => v.zone_id === zone.id).length;

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      total_households: zoneHouseholdIds.length,
      total_people: zoneMembers.length,
      total_eligible_voters: eligibleVoters.length,
      white_supporters: whiteSupporters,
      black_non_supporters: blackNonSupporters,
      red_undetermined: redUndetermined,
      unclassified: unclassified,
      support_score: supportScore,
      total_issues: issuesTotal,
      resolved_issues: issuesResolved,
      pending_issues: issuesPending,
      resolution_rate: resolutionRate,
      aid_distributions: aidCount,
      villages_count: villagesCount,
    };
  });

  // Calculate summary
  const totalZones = zoneStats.length;
  const totalHouseholds = zoneStats.reduce((sum, z) => sum + z.total_households, 0);
  const totalEligibleVoters = zoneStats.reduce((sum, z) => sum + z.total_eligible_voters, 0);
  const overallSupportScore = zoneStats.length > 0
    ? Number((zoneStats.reduce((sum, z) => sum + z.support_score, 0) / zoneStats.length).toFixed(2))
    : 0;
  const overallResolutionRate = zoneStats.length > 0
    ? Number((zoneStats.reduce((sum, z) => sum + z.resolution_rate, 0) / zoneStats.length).toFixed(2))
    : 0;

  return {
    success: true,
    data: {
      zones: zoneStats,
      summary: {
        total_zones: totalZones,
        total_households: totalHouseholds,
        total_eligible_voters: totalEligibleVoters,
        overall_support_score: overallSupportScore,
        overall_resolution_rate: overallResolutionRate,
      },
    },
  };
}

// Village Level Report
export type VillageLevelData = {
  villages: Array<{
    village_id: number;
    village_name: string;
    zone_id: number;
    zone_name: string;
    total_households: number;
    total_people: number;
    total_eligible_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
    aid_distributions: number;
  }>;
  summary: {
    total_villages: number;
    total_households: number;
    total_eligible_voters: number;
    overall_support_score: number;
  };
};

export async function getVillageLevelReport(): Promise<ActionResult<VillageLevelData>> {
  const supabase = await getSupabaseServerClient();
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: { villages: [], summary: {
        total_villages: 0,
        total_households: 0,
        total_eligible_voters: 0,
        overall_support_score: 0,
      } } };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);
  const zonesMap = new Map(zones.map(z => [z.id, z.name]));

  // Get villages
  const { data: villages, error: villagesError } = await supabase
    .from("villages")
    .select("id, zone_id, name")
    .in("zone_id", zoneIds)
    .order("name", { ascending: true });

  if (villagesError) {
    return { success: false, error: villagesError.message };
  }

  if (!villages || villages.length === 0) {
    return { success: true, data: { villages: [], summary: {
      total_villages: 0,
      total_households: 0,
      total_eligible_voters: 0,
      overall_support_score: 0,
    } } };
  }

  // Get all households in these zones (villages are matched by area field)
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id, area")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);

  // Get members
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth, voting_support_status")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Get aid distributions
  const { data: aidDistributions, error: aidError } = await supabase
    .from("aid_distributions")
    .select("household_id")
    .in("household_id", householdIds.length > 0 ? householdIds : [-1]);

  if (aidError) {
    return { success: false, error: aidError.message };
  }

  // Import utility functions
  const { isEligibleToVote } = await import("@/lib/utils/ic-number");

  // Match households to villages by area field (case-insensitive partial match)
  const villageStats = villages.map(village => {
    // Match households where area field contains village name (case-insensitive)
    const villageHouseholdIds = (households || [])
      .filter(h => {
        if (h.zone_id !== village.zone_id) return false;
        if (!h.area || !village.name) return false;
        return h.area.toLowerCase().includes(village.name.toLowerCase()) ||
               village.name.toLowerCase().includes(h.area.toLowerCase());
      })
      .map(h => h.id);

    const villageMembers = (members || []).filter(m => villageHouseholdIds.includes(m.household_id));
    const eligibleVoters = villageMembers.filter(m => isEligibleToVote(m.date_of_birth));
    
    const whiteSupporters = eligibleVoters.filter(v => v.voting_support_status === "white").length;
    const blackNonSupporters = eligibleVoters.filter(v => v.voting_support_status === "black").length;
    const redUndetermined = eligibleVoters.filter(v => v.voting_support_status === "red").length;
    const unclassified = eligibleVoters.filter(v => !v.voting_support_status).length;
    
    const classifiedVoters = whiteSupporters + blackNonSupporters + redUndetermined;
    const supportScore = classifiedVoters > 0
      ? Number(((whiteSupporters / classifiedVoters) * 100).toFixed(2))
      : 0;

    // Aid distributions
    const aidCount = (aidDistributions || []).filter(a => villageHouseholdIds.includes(a.household_id)).length;

    return {
      village_id: village.id,
      village_name: village.name,
      zone_id: village.zone_id,
      zone_name: zonesMap.get(village.zone_id) || "Unknown",
      total_households: villageHouseholdIds.length,
      total_people: villageMembers.length,
      total_eligible_voters: eligibleVoters.length,
      white_supporters: whiteSupporters,
      black_non_supporters: blackNonSupporters,
      red_undetermined: redUndetermined,
      unclassified: unclassified,
      support_score: supportScore,
      aid_distributions: aidCount,
    };
  });

  // Calculate summary
  const totalVillages = villageStats.length;
  const totalHouseholds = villageStats.reduce((sum, v) => sum + v.total_households, 0);
  const totalEligibleVoters = villageStats.reduce((sum, v) => sum + v.total_eligible_voters, 0);
  const overallSupportScore = villageStats.length > 0
    ? Number((villageStats.reduce((sum, v) => sum + v.support_score, 0) / villageStats.length).toFixed(2))
    : 0;

  return {
    success: true,
    data: {
      villages: villageStats,
      summary: {
        total_villages: totalVillages,
        total_households: totalHouseholds,
        total_eligible_voters: totalEligibleVoters,
        overall_support_score: overallSupportScore,
      },
    },
  };
}

// ADUN Dashboard Statistics
export type AdunDashboardStats = {
  total_villages: number;
  total_zones: number;
  total_voters: number;
  age_distribution: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  voters_by_locality: Array<{
    locality: string;
    count: number;
    percentage: number;
  }>;
  support_status: {
    white_supporters: number; // Full support
    black_non_supporters: number; // Not supporting
    red_undetermined: number; // Not determined
    unclassified: number; // No status set
    support_score: number; // 0-100 based on white/(white+black+red) ratio
    support_percentage: number; // Percentage of white supporters out of total
  };
};

/**
 * Get ADUN dashboard statistics (read-only version for Server Components)
 * Returns total villages, zones, and eligible voters for the ADUN's area
 * Use this in Server Components to avoid cookie modification errors
 */
export async function getAdunDashboardStats(): Promise<ActionResult<AdunDashboardStats>> {
  const supabase = await getSupabaseReadOnlyClient();
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();

  // Get accessible zones
  let zonesQuery = supabase.from("zones").select("id, name");
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { 
        success: true, 
        data: {
          total_villages: 0,
          total_zones: 0,
          total_voters: 0,
          age_distribution: [],
          voters_by_locality: [],
          support_status: {
            white_supporters: 0,
            black_non_supporters: 0,
            red_undetermined: 0,
            unclassified: 0,
            support_score: 0,
            support_percentage: 0,
          },
        } 
      };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError || !zones) {
    return { success: false, error: zonesError?.message || "Failed to fetch zones" };
  }

  const zoneIds = zones.map(z => z.id);
  const totalZones = zones.length;

  // Get total villages
  const { data: villages, error: villagesError } = await supabase
    .from("villages")
    .select("id")
    .in("zone_id", zoneIds);

  if (villagesError) {
    return { success: false, error: villagesError.message };
  }

  const totalVillages = villages?.length || 0;

  // Get households in accessible zones
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map(h => h.id);
  
  if (householdIds.length === 0) {
      return {
        success: true,
        data: {
          total_villages: totalVillages,
          total_zones: totalZones,
          total_voters: 0,
          age_distribution: [],
          voters_by_locality: [],
          support_status: {
            white_supporters: 0,
            black_non_supporters: 0,
            red_undetermined: 0,
            unclassified: 0,
            support_score: 0,
            support_percentage: 0,
          },
        },
      };
  }

  // Get all members with locality and voting support status
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("date_of_birth, locality, voting_support_status")
    .in("household_id", householdIds);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Count eligible voters
  const eligibleVoters = (members || []).filter(m => isEligibleToVote(m.date_of_birth));
  const totalVoters = eligibleVoters.length;

  // Age distribution
  const ageGroups = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56-65": 0,
    "65+": 0,
  };

  eligibleVoters.forEach(voter => {
    const age = calculateAge(voter.date_of_birth);
    if (age !== null) {
      if (age >= 18 && age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 45) ageGroups["36-45"]++;
      else if (age <= 55) ageGroups["46-55"]++;
      else if (age <= 65) ageGroups["56-65"]++;
      else ageGroups["65+"]++;
    }
  });

  const ageDistribution = Object.entries(ageGroups)
    .map(([age_group, count]) => ({
      age_group,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .filter(item => item.count > 0);

  // Voters by locality
  const localityMap = new Map<string, number>();
  eligibleVoters.forEach(voter => {
    const locality = voter.locality || "Not Specified";
    localityMap.set(locality, (localityMap.get(locality) || 0) + 1);
  });

  const votersByLocality = Array.from(localityMap.entries())
    .map(([locality, count]) => ({
      locality,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 localities

  // Support status analysis
  const whiteSupporters = eligibleVoters.filter(v => v.voting_support_status === "white").length;
  const blackNonSupporters = eligibleVoters.filter(v => v.voting_support_status === "black").length;
  const redUndetermined = eligibleVoters.filter(v => v.voting_support_status === "red").length;
  const unclassified = eligibleVoters.filter(v => !v.voting_support_status).length;

  // Support score: (white / (white + black + red)) * 100
  // Only count voters with a status (white, black, or red), exclude unclassified
  const classifiedVoters = whiteSupporters + blackNonSupporters + redUndetermined;
  const supportScore = classifiedVoters > 0
    ? Number(((whiteSupporters / classifiedVoters) * 100).toFixed(2))
    : 0;

  // Support percentage: white / total eligible voters
  const supportPercentage = totalVoters > 0
    ? Number(((whiteSupporters / totalVoters) * 100).toFixed(2))
    : 0;

  return {
    success: true,
    data: {
      total_villages: totalVillages,
      total_zones: totalZones,
      total_voters: totalVoters,
      age_distribution: ageDistribution,
      voters_by_locality: votersByLocality,
      support_status: {
        white_supporters: whiteSupporters,
        black_non_supporters: blackNonSupporters,
        red_undetermined: redUndetermined,
        unclassified: unclassified,
        support_score: supportScore,
        support_percentage: supportPercentage,
      },
    },
  };
}

/**
 * Get ADUN dashboard statistics from SPR voters data (read-only version for Server Components)
 * Returns total villages, zones, and voters from SPR data for the ADUN's area
 * Use this in Server Components to avoid cookie modification errors
 */
export async function getAdunDashboardStatsFromSpr(versionId?: number): Promise<ActionResult<AdunDashboardStats>> {
  const supabase = await getSupabaseReadOnlyClient();
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();
  const access = await getCurrentUserAccessReadOnly();
  
  // For super admin or ADUN, they can see all zones (accessibleZoneIds is null)
  // For zone leaders, accessibleZoneIds is an array of their zone IDs
  const isSuperAdminOrAdun = access.isSuperAdmin || access.isAdun;

  // Get accessible zones with DUN information
  let zonesQuery = supabase.from("zones").select("id, name, dun_id");
  let totalZones = 0;
  let zoneIds: number[] = [];
  
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { 
        success: true, 
        data: {
          total_villages: 0,
          total_zones: 0,
          total_voters: 0,
          age_distribution: [],
          voters_by_locality: [],
          support_status: {
            white_supporters: 0,
            black_non_supporters: 0,
            red_undetermined: 0,
            unclassified: 0,
            support_score: 0,
            support_percentage: 0,
          },
        } 
      };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  const { data: zones, error: zonesError } = await zonesQuery;
  if (zonesError) {
    return { success: false, error: zonesError.message || "Failed to fetch zones" };
  }

  if (zones && zones.length > 0) {
    zoneIds = zones.map(z => z.id);
    totalZones = zones.length;
  } else if (isSuperAdminOrAdun) {
    // For super admin/ADUN, if no zones found, still proceed (they might not have zones set up yet)
    // We'll show all SPR voters
    totalZones = 0;
  } else {
    // For zone leaders with no zones, return empty
    return {
      success: true,
      data: {
        total_villages: 0,
        total_zones: 0,
        total_voters: 0,
        age_distribution: [],
        voters_by_locality: [],
        support_status: {
          white_supporters: 0,
          black_non_supporters: 0,
          red_undetermined: 0,
          unclassified: 0,
          support_score: 0,
          support_percentage: 0,
        },
      },
    };
  }

  // Get DUN IDs from zones
  const dunIds = zones ? [...new Set(zones.map(z => z.dun_id).filter(Boolean))] : [];
  
  // Get DUN names
  let dunNames: string[] = [];
  if (dunIds.length > 0) {
    const { data: duns, error: dunsError } = await supabase
      .from("duns")
      .select("name")
      .in("id", dunIds);
    
    if (!dunsError && duns) {
      dunNames = duns.map(d => d.name).filter(Boolean);
    }
  }

  // Get total villages
  const { data: villages, error: villagesError } = await supabase
    .from("villages")
    .select("id")
    .in("zone_id", zoneIds);

  if (villagesError) {
    return { success: false, error: villagesError.message };
  }

  const totalVillages = villages?.length || 0;

  // Get active SPR version if not specified
  let selectedVersionId = versionId;
  if (!selectedVersionId) {
    const versionsResult = await getVoterVersions();
    const versions = versionsResult.success ? versionsResult.data || [] : [];
    const activeVersion = versions.find((v) => v.is_active);
    selectedVersionId = activeVersion?.id;
  }

  // If no active version found, return empty stats
  if (!selectedVersionId) {
    return {
      success: true,
      data: {
        total_villages: totalVillages,
        total_zones: totalZones,
        total_voters: 0,
        age_distribution: [],
        voters_by_locality: [],
        support_status: {
          white_supporters: 0,
          black_non_supporters: 0,
          red_undetermined: 0,
          unclassified: 0,
          support_score: 0,
          support_percentage: 0,
        },
      },
    };
  }

  // Get SPR voters filtered by DUN name
  // Fetch all voters in batches (Supabase has a default limit of 1000)
  let allVoters: any[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let votersQuery = supabase
      .from("spr_voters")
      .select("id, tarikh_lahir, nama_lokaliti, voting_support_status, nama_dun")
      .eq("version_id", selectedVersionId)
      .range(offset, offset + batchSize - 1);

    // Filter by DUN name if we have DUN names
    // For super admin/ADUN: if no DUN names found, show all voters (don't filter by DUN)
    // For zone leaders: filter by DUN names if available
    // Only filter by DUN if we have DUN names AND (user is not super admin/ADUN OR we want to filter)
    if (dunNames.length > 0 && (!isSuperAdminOrAdun || zoneIds.length > 0)) {
      // Use case-insensitive matching with ilike for better matching
      // Build OR conditions for each DUN name
      const dunConditions = dunNames
        .map(name => name.trim())
        .filter(Boolean)
        .map(name => `nama_dun.ilike.%${name}%`)
        .join(",");
      if (dunConditions) {
        votersQuery = votersQuery.or(dunConditions);
      }
    }
    // If dunNames.length === 0 OR user is super admin/ADUN with no zones, don't filter by DUN (show all voters for the version)

    const { data: batch, error: votersError } = await votersQuery;

    if (votersError) {
      return { success: false, error: votersError.message };
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      allVoters.push(...batch);
      offset += batchSize;
      // If we got fewer records than batch size, we've reached the end
      if (batch.length < batchSize) {
        hasMore = false;
      }
    }
  }

  let voters = allVoters;
  let totalVoters = voters.length;

  // If we filtered by DUN names but got 0 results, and user is super admin/ADUN,
  // try again without DUN filter (in case DUN names don't match)
  if (totalVoters === 0 && dunNames.length > 0 && isSuperAdminOrAdun) {
    // Retry without DUN filter
    allVoters = [];
    offset = 0;
    hasMore = true;
    
    while (hasMore) {
      let votersQuery = supabase
        .from("spr_voters")
        .select("id, tarikh_lahir, nama_lokaliti, voting_support_status, nama_dun")
        .eq("version_id", selectedVersionId)
        .range(offset, offset + batchSize - 1);

      const { data: batch, error: votersError } = await votersQuery;

      if (votersError) {
        return { success: false, error: votersError.message };
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
      } else {
        allVoters.push(...batch);
        offset += batchSize;
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }
    }
    
    voters = allVoters;
    totalVoters = voters.length;
  }

  if (totalVoters === 0) {
    return {
      success: true,
      data: {
        total_villages: totalVillages,
        total_zones: totalZones,
        total_voters: 0,
        age_distribution: [],
        voters_by_locality: [],
        support_status: {
          white_supporters: 0,
          black_non_supporters: 0,
          red_undetermined: 0,
          unclassified: 0,
          support_score: 0,
          support_percentage: 0,
        },
      },
    };
  }

  // Age distribution
  const ageGroups = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56-65": 0,
    "65+": 0,
  };

  voters.forEach(voter => {
    const age = calculateAge(voter.tarikh_lahir);
    if (age !== null && age >= 18) {
      if (age >= 18 && age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 45) ageGroups["36-45"]++;
      else if (age <= 55) ageGroups["46-55"]++;
      else if (age <= 65) ageGroups["56-65"]++;
      else ageGroups["65+"]++;
    }
  });

  const ageDistribution = Object.entries(ageGroups)
    .map(([age_group, count]) => ({
      age_group,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .filter(item => item.count > 0);

  // Voters by locality
  const localityMap = new Map<string, number>();
  voters.forEach(voter => {
    const locality = voter.nama_lokaliti || "Not Specified";
    localityMap.set(locality, (localityMap.get(locality) || 0) + 1);
  });

  const votersByLocality = Array.from(localityMap.entries())
    .map(([locality, count]) => ({
      locality,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 localities

  // Support status analysis
  const whiteSupporters = voters.filter(v => v.voting_support_status === "white").length;
  const blackNonSupporters = voters.filter(v => v.voting_support_status === "black").length;
  const redUndetermined = voters.filter(v => v.voting_support_status === "red").length;
  const unclassified = voters.filter(v => !v.voting_support_status).length;

  // Support score: (white / (white + black + red)) * 100
  // Only count voters with a status (white, black, or red), exclude unclassified
  const classifiedVoters = whiteSupporters + blackNonSupporters + redUndetermined;
  const supportScore = classifiedVoters > 0
    ? Number(((whiteSupporters / classifiedVoters) * 100).toFixed(2))
    : 0;

  // Support percentage: white / total voters
  const supportPercentage = totalVoters > 0
    ? Number(((whiteSupporters / totalVoters) * 100).toFixed(2))
    : 0;

  return {
    success: true,
    data: {
      total_villages: totalVillages,
      total_zones: totalZones,
      total_voters: totalVoters,
      age_distribution: ageDistribution,
      voters_by_locality: votersByLocality,
      support_status: {
        white_supporters: whiteSupporters,
        black_non_supporters: blackNonSupporters,
        red_undetermined: redUndetermined,
        unclassified: unclassified,
        support_score: supportScore,
        support_percentage: supportPercentage,
      },
    },
  };
}

// SPR Voter Support Report
export type SprVoterSupportData = {
  versions: Array<{
    version_id: number;
    version_name: string;
    total_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
    support_percentage: number;
  }>;
  by_locality: Array<{
    locality: string;
    total_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
  }>;
  by_parliament: Array<{
    parliament: string;
    total_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
  }>;
  by_polling_station: Array<{
    polling_station: string;
    total_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
  }>;
  by_channel: Array<{
    channel: number | null;
    total_voters: number;
    white_supporters: number;
    black_non_supporters: number;
    red_undetermined: number;
    unclassified: number;
    support_score: number;
  }>;
  overall_support_score: number;
  total_voters: number;
  total_white_supporters: number;
  total_black_non_supporters: number;
  total_red_undetermined: number;
  total_unclassified: number;
};

export async function getSprVoterSupportReport(
  versionId?: number
): Promise<ActionResult<SprVoterSupportData>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Fetch all voters in batches (Supabase has a default limit of 1000)
  const allVoters: any[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let votersQuery = supabase
      .from("spr_voters")
      .select("id, version_id, nama_lokaliti, nama_parlimen, nama_tm, saluran, voting_support_status")
      .range(offset, offset + batchSize - 1);

    if (versionId) {
      votersQuery = votersQuery.eq("version_id", versionId);
    }

    const { data: batch, error: votersError } = await votersQuery;

    if (votersError) {
      return { success: false, error: votersError.message };
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      allVoters.push(...batch);
      offset += batchSize;
      // If we got fewer records than batch size, we've reached the end
      if (batch.length < batchSize) {
        hasMore = false;
      }
    }
  }

  const voters = allVoters;

  if (!voters || voters.length === 0) {
    return {
      success: true,
      data: {
        versions: [],
        by_locality: [],
        by_parliament: [],
        by_polling_station: [],
        by_channel: [],
        overall_support_score: 0,
        total_voters: 0,
        total_white_supporters: 0,
        total_black_non_supporters: 0,
        total_red_undetermined: 0,
        total_unclassified: 0,
      },
    };
  }

  // Get versions
  const versionsResult = await getVoterVersions();
  const versions = versionsResult.success ? versionsResult.data || [] : [];
  const versionsMap = new Map(versions.map((v) => [v.id, v.name]));

  // Calculate by version
  const versionStats = new Map<
    number,
    {
      total: number;
      white: number;
      black: number;
      red: number;
      unclassified: number;
    }
  >();

  voters.forEach((voter) => {
    const stats = versionStats.get(voter.version_id) || {
      total: 0,
      white: 0,
      black: 0,
      red: 0,
      unclassified: 0,
    };
    stats.total++;
    if (voter.voting_support_status === "white") stats.white++;
    else if (voter.voting_support_status === "black") stats.black++;
    else if (voter.voting_support_status === "red") stats.red++;
    else if (
      voter.voting_support_status === null ||
      voter.voting_support_status === undefined ||
      voter.voting_support_status === ""
    )
      stats.unclassified++;
    versionStats.set(voter.version_id, stats);
  });

  const versionData = Array.from(versionStats.entries()).map(([versionId, stats]) => {
    const classified = stats.white + stats.black + stats.red;
    const supportScore = classified > 0 ? Number(((stats.white / classified) * 100).toFixed(2)) : 0;
    const supportPercentage =
      stats.total > 0 ? Number(((stats.white / stats.total) * 100).toFixed(2)) : 0;

    return {
      version_id: versionId,
      version_name: versionsMap.get(versionId) || `Version ${versionId}`,
      total_voters: stats.total,
      white_supporters: stats.white,
      black_non_supporters: stats.black,
      red_undetermined: stats.red,
      unclassified: stats.unclassified,
      support_score: supportScore,
      support_percentage: supportPercentage,
    };
  });

  // Calculate by locality
  const localityStats = new Map<
    string,
    {
      total: number;
      white: number;
      black: number;
      red: number;
      unclassified: number;
    }
  >();

  voters.forEach((voter) => {
    const locality = voter.nama_lokaliti || "Not Specified";
    const stats = localityStats.get(locality) || {
      total: 0,
      white: 0,
      black: 0,
      red: 0,
      unclassified: 0,
    };
    stats.total++;
    if (voter.voting_support_status === "white") stats.white++;
    else if (voter.voting_support_status === "black") stats.black++;
    else if (voter.voting_support_status === "red") stats.red++;
    else if (
      voter.voting_support_status === null ||
      voter.voting_support_status === undefined ||
      voter.voting_support_status === ""
    )
      stats.unclassified++;
    localityStats.set(locality, stats);
  });

  const localityData = Array.from(localityStats.entries())
    .map(([locality, stats]) => {
      const classified = stats.white + stats.black + stats.red;
      const supportScore = classified > 0 ? Number(((stats.white / classified) * 100).toFixed(2)) : 0;

      return {
        locality,
        total_voters: stats.total,
        white_supporters: stats.white,
        black_non_supporters: stats.black,
        red_undetermined: stats.red,
        unclassified: stats.unclassified,
        support_score: supportScore,
      };
    })
    .sort((a, b) => b.total_voters - a.total_voters);

  // Calculate by polling station
  const pollingStationStats = new Map<
    string,
    {
      total: number;
      white: number;
      black: number;
      red: number;
      unclassified: number;
    }
  >();

  voters.forEach((voter) => {
    const pollingStation = voter.nama_tm || "Not Specified";
    const stats = pollingStationStats.get(pollingStation) || {
      total: 0,
      white: 0,
      black: 0,
      red: 0,
      unclassified: 0,
    };
    stats.total++;
    if (voter.voting_support_status === "white") stats.white++;
    else if (voter.voting_support_status === "black") stats.black++;
    else if (voter.voting_support_status === "red") stats.red++;
    else if (
      voter.voting_support_status === null ||
      voter.voting_support_status === undefined ||
      voter.voting_support_status === ""
    )
      stats.unclassified++;
    pollingStationStats.set(pollingStation, stats);
  });

  const pollingStationData = Array.from(pollingStationStats.entries())
    .map(([pollingStation, stats]) => {
      const classified = stats.white + stats.black + stats.red;
      const supportScore = classified > 0 ? Number(((stats.white / classified) * 100).toFixed(2)) : 0;

      return {
        polling_station: pollingStation,
        total_voters: stats.total,
        white_supporters: stats.white,
        black_non_supporters: stats.black,
        red_undetermined: stats.red,
        unclassified: stats.unclassified,
        support_score: supportScore,
      };
    })
    .sort((a, b) => b.total_voters - a.total_voters);

  // Calculate by parliament
  const parliamentStats = new Map<
    string,
    {
      total: number;
      white: number;
      black: number;
      red: number;
      unclassified: number;
    }
  >();

  voters.forEach((voter) => {
    const parliament = voter.nama_parlimen || "Not Specified";
    const stats = parliamentStats.get(parliament) || {
      total: 0,
      white: 0,
      black: 0,
      red: 0,
      unclassified: 0,
    };
    stats.total++;
    if (voter.voting_support_status === "white") stats.white++;
    else if (voter.voting_support_status === "black") stats.black++;
    else if (voter.voting_support_status === "red") stats.red++;
    else if (
      voter.voting_support_status === null ||
      voter.voting_support_status === undefined ||
      voter.voting_support_status === ""
    )
      stats.unclassified++;
    parliamentStats.set(parliament, stats);
  });

  const parliamentData = Array.from(parliamentStats.entries())
    .map(([parliament, stats]) => {
      const classified = stats.white + stats.black + stats.red;
      const supportScore = classified > 0 ? Number(((stats.white / classified) * 100).toFixed(2)) : 0;

      return {
        parliament,
        total_voters: stats.total,
        white_supporters: stats.white,
        black_non_supporters: stats.black,
        red_undetermined: stats.red,
        unclassified: stats.unclassified,
        support_score: supportScore,
      };
    })
    .sort((a, b) => b.total_voters - a.total_voters);

  // Calculate by channel
  const channelStats = new Map<
    number | null,
    {
      total: number;
      white: number;
      black: number;
      red: number;
      unclassified: number;
    }
  >();

  voters.forEach((voter) => {
    const channel = voter.saluran ?? null;
    const stats = channelStats.get(channel) || {
      total: 0,
      white: 0,
      black: 0,
      red: 0,
      unclassified: 0,
    };
    stats.total++;
    if (voter.voting_support_status === "white") stats.white++;
    else if (voter.voting_support_status === "black") stats.black++;
    else if (voter.voting_support_status === "red") stats.red++;
    else if (
      voter.voting_support_status === null ||
      voter.voting_support_status === undefined ||
      voter.voting_support_status === ""
    )
      stats.unclassified++;
    channelStats.set(channel, stats);
  });

  const channelData = Array.from(channelStats.entries())
    .map(([channel, stats]) => {
      const classified = stats.white + stats.black + stats.red;
      const supportScore = classified > 0 ? Number(((stats.white / classified) * 100).toFixed(2)) : 0;

      return {
        channel,
        total_voters: stats.total,
        white_supporters: stats.white,
        black_non_supporters: stats.black,
        red_undetermined: stats.red,
        unclassified: stats.unclassified,
        support_score: supportScore,
      };
    })
    .sort((a, b) => {
      // Sort by channel number, with null last
      if (a.channel === null && b.channel === null) return 0;
      if (a.channel === null) return 1;
      if (b.channel === null) return -1;
      return a.channel - b.channel;
    });

  // Calculate overall totals
  const totalVoters = voters.length;
  const totalWhiteSupporters = voters.filter((v) => v.voting_support_status === "white").length;
  const totalBlackNonSupporters = voters.filter((v) => v.voting_support_status === "black").length;
  const totalRedUndetermined = voters.filter((v) => v.voting_support_status === "red").length;
  // Unclassified: voters with null, undefined, or empty voting_support_status
  const totalUnclassified = voters.filter(
    (v) =>
      v.voting_support_status === null ||
      v.voting_support_status === undefined ||
      v.voting_support_status === ""
  ).length;

  const totalClassified = totalWhiteSupporters + totalBlackNonSupporters + totalRedUndetermined;
  const overallSupportScore =
    totalClassified > 0 ? Number(((totalWhiteSupporters / totalClassified) * 100).toFixed(2)) : 0;

  return {
    success: true,
    data: {
      versions: versionData,
      by_locality: localityData,
      by_parliament: parliamentData,
      by_polling_station: pollingStationData,
      by_channel: channelData,
      overall_support_score: overallSupportScore,
      total_voters: totalVoters,
      total_white_supporters: totalWhiteSupporters,
      total_black_non_supporters: totalBlackNonSupporters,
      total_red_undetermined: totalRedUndetermined,
      total_unclassified: totalUnclassified,
    },
  };
}

// SPR Voter Demographic Report
export type SprVoterDemographicData = {
  total_voters: number;
  age_distribution: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  gender_distribution: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  race_distribution: Array<{
    race: string;
    count: number;
    percentage: number;
  }>;
  religion_distribution: Array<{
    religion: string;
    count: number;
    percentage: number;
  }>;
  ethnic_category_distribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  by_locality: Array<{
    locality: string;
    total_voters: number;
    age_distribution: Array<{
      age_group: string;
      count: number;
      percentage: number;
    }>;
    gender_distribution: Array<{
      gender: string;
      count: number;
      percentage: number;
    }>;
  }>;
  by_parliament: Array<{
    parliament: string;
    total_voters: number;
    age_distribution: Array<{
      age_group: string;
      count: number;
      percentage: number;
    }>;
  }>;
};

export async function getSprVoterDemographicReport(
  versionId?: number
): Promise<ActionResult<SprVoterDemographicData>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Fetch all voters in batches (Supabase has a default limit of 1000)
  const allVoters: any[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let votersQuery = supabase
      .from("spr_voters")
      .select("id, version_id, nama_lokaliti, nama_parlimen, jantina, bangsa, agama, kategori_kaum, tarikh_lahir")
      .range(offset, offset + batchSize - 1);

    if (versionId) {
      votersQuery = votersQuery.eq("version_id", versionId);
    }

    const { data: batch, error: votersError } = await votersQuery;

    if (votersError) {
      return { success: false, error: votersError.message };
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      allVoters.push(...batch);
      offset += batchSize;
      // If we got fewer records than batch size, we've reached the end
      if (batch.length < batchSize) {
        hasMore = false;
      }
    }
  }

  const voters = allVoters;

  if (!voters || voters.length === 0) {
    return {
      success: true,
      data: {
        total_voters: 0,
        age_distribution: [],
        gender_distribution: [],
        race_distribution: [],
        religion_distribution: [],
        ethnic_category_distribution: [],
        by_locality: [],
        by_parliament: [],
      },
    };
  }

  const totalVoters = voters.length;

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Age distribution
  const ageGroups = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56-65": 0,
    "65+": 0,
    "Unknown": 0,
  };

  voters.forEach((voter) => {
    const age = calculateAge(voter.tarikh_lahir);
    if (age === null) {
      ageGroups["Unknown"]++;
    } else if (age >= 18 && age <= 25) {
      ageGroups["18-25"]++;
    } else if (age <= 35) {
      ageGroups["26-35"]++;
    } else if (age <= 45) {
      ageGroups["36-45"]++;
    } else if (age <= 55) {
      ageGroups["46-55"]++;
    } else if (age <= 65) {
      ageGroups["56-65"]++;
    } else {
      ageGroups["65+"]++;
    }
  });

  const ageDistribution = Object.entries(ageGroups)
    .map(([age_group, count]) => ({
      age_group,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .filter((item) => item.count > 0);

  // Gender distribution
  const genderMap = new Map<string, number>();
  voters.forEach((voter) => {
    const gender = voter.jantina || "Not Specified";
    genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
  });

  const genderDistribution = Array.from(genderMap.entries())
    .map(([gender, count]) => ({
      gender,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Race distribution
  const raceMap = new Map<string, number>();
  voters.forEach((voter) => {
    const race = voter.bangsa || "Not Specified";
    raceMap.set(race, (raceMap.get(race) || 0) + 1);
  });

  const raceDistribution = Array.from(raceMap.entries())
    .map(([race, count]) => ({
      race,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Religion distribution
  const religionMap = new Map<string, number>();
  voters.forEach((voter) => {
    const religion = voter.agama || "Not Specified";
    religionMap.set(religion, (religionMap.get(religion) || 0) + 1);
  });

  const religionDistribution = Array.from(religionMap.entries())
    .map(([religion, count]) => ({
      religion,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Ethnic category distribution
  const categoryMap = new Map<string, number>();
  voters.forEach((voter) => {
    const category = voter.kategori_kaum || "Not Specified";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const ethnicCategoryDistribution = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalVoters > 0 ? Number(((count / totalVoters) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // By locality
  const localityStats = new Map<
    string,
    {
      voters: Array<{
        jantina: string | null;
        tarikh_lahir: string | null;
      }>;
    }
  >();

  voters.forEach((voter) => {
    const locality = voter.nama_lokaliti || "Not Specified";
    const stats = localityStats.get(locality) || { voters: [] };
    stats.voters.push({
      jantina: voter.jantina,
      tarikh_lahir: voter.tarikh_lahir,
    });
    localityStats.set(locality, stats);
  });

  const localityData = Array.from(localityStats.entries())
    .map(([locality, stats]) => {
      const localityTotal = stats.voters.length;

      // Age distribution for locality
      const localityAgeGroups = {
        "18-25": 0,
        "26-35": 0,
        "36-45": 0,
        "46-55": 0,
        "56-65": 0,
        "65+": 0,
        "Unknown": 0,
      };

      stats.voters.forEach((voter) => {
        const age = calculateAge(voter.tarikh_lahir);
        if (age === null) {
          localityAgeGroups["Unknown"]++;
        } else if (age >= 18 && age <= 25) {
          localityAgeGroups["18-25"]++;
        } else if (age <= 35) {
          localityAgeGroups["26-35"]++;
        } else if (age <= 45) {
          localityAgeGroups["36-45"]++;
        } else if (age <= 55) {
          localityAgeGroups["46-55"]++;
        } else if (age <= 65) {
          localityAgeGroups["56-65"]++;
        } else {
          localityAgeGroups["65+"]++;
        }
      });

      const localityAgeDistribution = Object.entries(localityAgeGroups)
        .map(([age_group, count]) => ({
          age_group,
          count,
          percentage: localityTotal > 0 ? Number(((count / localityTotal) * 100).toFixed(2)) : 0,
        }))
        .filter((item) => item.count > 0);

      // Gender distribution for locality
      const localityGenderMap = new Map<string, number>();
      stats.voters.forEach((voter) => {
        const gender = voter.jantina || "Not Specified";
        localityGenderMap.set(gender, (localityGenderMap.get(gender) || 0) + 1);
      });

      const localityGenderDistribution = Array.from(localityGenderMap.entries())
        .map(([gender, count]) => ({
          gender,
          count,
          percentage: localityTotal > 0 ? Number(((count / localityTotal) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        locality,
        total_voters: localityTotal,
        age_distribution: localityAgeDistribution,
        gender_distribution: localityGenderDistribution,
      };
    })
    .sort((a, b) => b.total_voters - a.total_voters);

  // By parliament
  const parliamentStats = new Map<
    string,
    {
      voters: Array<{
        tarikh_lahir: string | null;
      }>;
    }
  >();

  voters.forEach((voter) => {
    const parliament = voter.nama_parlimen || "Not Specified";
    const stats = parliamentStats.get(parliament) || { voters: [] };
    stats.voters.push({
      tarikh_lahir: voter.tarikh_lahir,
    });
    parliamentStats.set(parliament, stats);
  });

  const parliamentData = Array.from(parliamentStats.entries())
    .map(([parliament, stats]) => {
      const parliamentTotal = stats.voters.length;

      // Age distribution for parliament
      const parliamentAgeGroups = {
        "18-25": 0,
        "26-35": 0,
        "36-45": 0,
        "46-55": 0,
        "56-65": 0,
        "65+": 0,
        "Unknown": 0,
      };

      stats.voters.forEach((voter) => {
        const age = calculateAge(voter.tarikh_lahir);
        if (age === null) {
          parliamentAgeGroups["Unknown"]++;
        } else if (age >= 18 && age <= 25) {
          parliamentAgeGroups["18-25"]++;
        } else if (age <= 35) {
          parliamentAgeGroups["26-35"]++;
        } else if (age <= 45) {
          parliamentAgeGroups["36-45"]++;
        } else if (age <= 55) {
          parliamentAgeGroups["46-55"]++;
        } else if (age <= 65) {
          parliamentAgeGroups["56-65"]++;
        } else {
          parliamentAgeGroups["65+"]++;
        }
      });

      const parliamentAgeDistribution = Object.entries(parliamentAgeGroups)
        .map(([age_group, count]) => ({
          age_group,
          count,
          percentage: parliamentTotal > 0 ? Number(((count / parliamentTotal) * 100).toFixed(2)) : 0,
        }))
        .filter((item) => item.count > 0);

      return {
        parliament,
        total_voters: parliamentTotal,
        age_distribution: parliamentAgeDistribution,
      };
    })
    .sort((a, b) => b.total_voters - a.total_voters);

  return {
    success: true,
    data: {
      total_voters: totalVoters,
      age_distribution: ageDistribution,
      gender_distribution: genderDistribution,
      race_distribution: raceDistribution,
      religion_distribution: religionDistribution,
      ethnic_category_distribution: ethnicCategoryDistribution,
      by_locality: localityData,
      by_parliament: parliamentData,
    },
  };
}
