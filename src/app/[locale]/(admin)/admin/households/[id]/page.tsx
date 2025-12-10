import { ArrowLeft, Users, Home, DollarSign, Package, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getHouseholdById } from "@/lib/actions/households";
import { notFound, redirect } from "next/navigation";
import HouseholdFormModal from "../HouseholdFormModal";
import MembersSection from "./MembersSection";
import IncomeSection from "./IncomeSection";
import AidDistributionSection from "./AidDistributionSection";
import FamilyTreeView from "@/components/households/FamilyTreeView";
import { getUserWorkspaceType, getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";
import { getTranslations } from "next-intl/server";

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const householdId = parseInt(id, 10);

  if (Number.isNaN(householdId)) {
    notFound();
  }

  // Check authentication first
  try {
    const access = await getCurrentUserAccessReadOnly();
    if (!access.isAuthenticated || !access.staffId) {
      redirect("/admin/login");
    }
  } catch (error: any) {
    // Session expired or invalid - redirect to login
    // Also catch cookie modification errors
    if (error?.message?.includes("Cookies can only be modified") || 
        error?.message?.includes("session") ||
        error?.message?.includes("cookie")) {
      redirect("/admin/login");
    }
    // Re-throw other errors
    throw error;
  }

  let result;
  try {
    result = await getHouseholdById(householdId);
  } catch (error: any) {
    // Catch cookie modification errors or session errors
    if (error?.message?.includes("Cookies can only be modified") || 
        error?.message?.includes("Session expired") ||
        error?.message?.includes("session")) {
      redirect("/admin/login");
    }
    // Re-throw other errors
    throw error;
  }

  if (!result.success) {
    // Check if error is session-related
    if (result.error?.includes("Session expired") || 
        result.error?.includes("session") ||
        result.error?.includes("cookie")) {
      redirect("/admin/login");
    }
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  const household = result.data;
  const t = await getTranslations("households.detail");

  // Check if user is admin (super_admin, adun, zone_leader, or staff_manager)
  const workspaceType = await getUserWorkspaceType();
  const isAdmin = workspaceType === "admin";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/households">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              {t("back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
              {household.head_name}
            </h1>
            <p className="text-gray-600 mt-1">{household.address}</p>
          </div>
        </div>
        <HouseholdFormModal
          household={household}
          trigger={
            <Button variant="outline" className="gap-2">
              {t("editHousehold")}
            </Button>
          }
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">{t("statistics.totalMembers")}</p>
          </div>
          <p className="text-3xl font-bold">{household.total_members || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">{t("statistics.membersAtHome")}</p>
          </div>
          <p className="text-3xl font-bold">{household.members_at_home || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-orange-600" />
            <p className="text-sm text-gray-600">{t("statistics.dependents")}</p>
          </div>
          <p className="text-3xl font-bold">{household.total_dependents || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="size-5 text-purple-600" />
            <p className="text-sm text-gray-600">{t("statistics.monthlyIncome")}</p>
          </div>
          <p className="text-3xl font-bold">
            {household.latest_income !== null && household.latest_income !== undefined
              ? `RM ${household.latest_income.toLocaleString()}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Warning if members at home don't match total */}
      {household.total_members !== undefined &&
        household.members_at_home !== undefined &&
        household.total_members > 0 &&
        household.members_at_home < household.total_members && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">{t("warning.title")}</h3>
                <p className="text-sm text-yellow-800">
                  {t("warning.message", { count: household.total_members - household.members_at_home })}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Household Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t("householdInfo.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">{t("householdInfo.headIcNumber")}</p>
            <p className="font-medium">{household.head_ic_number || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("householdInfo.phoneNumber")}</p>
            <p className="font-medium">{household.head_phone || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("householdInfo.areaZone")}</p>
            <p className="font-medium">
              {household.area ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {household.area}
                </span>
              ) : (
                "—"
              )}
            </p>
          </div>
          {household.notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">{t("householdInfo.notes")}</p>
              <p className="font-medium">{household.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Family Tree View */}
      <FamilyTreeView members={household.members} />

      {/* Members Section */}
      <MembersSection householdId={householdId} members={household.members} isAdmin={isAdmin} />

      {/* Income Section */}
      <IncomeSection householdId={householdId} income={household.income} />

      {/* Aid Distribution Section */}
      <AidDistributionSection
        householdId={householdId}
        membersAtHome={household.members_at_home || 0}
        totalDependents={household.total_dependents || 0}
        distributions={household.latestAidDistributions}
      />
    </div>
  );
}
