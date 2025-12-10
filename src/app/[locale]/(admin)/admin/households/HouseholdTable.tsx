"use client";

import Link from "next/link";
import { Users, Home, DollarSign, AlertCircle, Plus, UserPlus, Network } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Household } from "@/lib/actions/households";
import QuickAddMemberModal from "@/components/households/QuickAddMemberModal";
import QuickAddIncomeModal from "@/components/households/QuickAddIncomeModal";
import FamilyTreeModal from "@/components/households/FamilyTreeModal";

type Props = {
  households: Household[];
  translations?: Record<string, string>;
};

export default function HouseholdTable({ households, translations }: Props) {
  const t = useTranslations("households.table");
  
  if (households.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <Home className="size-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("noHouseholdsFound")}</h3>
        <p className="text-gray-600">{t("getStarted")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="text-left">
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("headOfHousehold")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("address")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("area")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("members")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("atHome")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("dependents")}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("income")}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {households.map((household) => (
            <tr key={household.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/households/${household.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {household.head_name}
                </Link>
                {household.head_phone && (
                  <div className="text-xs text-gray-500 mt-1">{household.head_phone}</div>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">{household.address}</td>
              <td className="px-4 py-3">
                {household.area ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                    {household.area}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-gray-400" />
                  <span className="font-medium">{household.total_members || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Home className="size-4 text-green-600" />
                  <span className="font-medium text-green-700">{household.members_at_home || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-orange-600" />
                  <span className="font-medium text-orange-700">{household.total_dependents || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {household.latest_income !== null && household.latest_income !== undefined ? (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="size-4 text-gray-400" />
                    <span>RM {household.latest_income.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <FamilyTreeModal
                    householdId={household.id}
                    trigger={
                      <button
                        className="p-1.5 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                        title={t("actions.viewFamilyTree")}
                      >
                        <Network className="size-4" />
                      </button>
                    }
                  />
                  <QuickAddMemberModal
                    householdId={household.id}
                    trigger={
                      <button
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                        title={t("actions.addMember")}
                      >
                        <UserPlus className="size-4" />
                      </button>
                    }
                  />
                  <QuickAddIncomeModal
                    householdId={household.id}
                    currentIncome={household.latest_income}
                    trigger={
                      <button
                        className="p-1.5 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                        title={t("actions.addIncome")}
                      >
                        <DollarSign className="size-4" />
                      </button>
                    }
                  />
                  <Link
                    href={`/admin/households/${household.id}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {t("view")}
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
