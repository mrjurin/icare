"use client";

import { useMemo } from "react";
import { Users, Home, UserX, Baby, User } from "lucide-react";
import type { HouseholdMember, MemberRelationship } from "@/lib/actions/households";
import { useTranslations } from "next-intl";

type TreeNode = {
  member: HouseholdMember;
  children: TreeNode[];
  level: number;
};

type Props = {
  members: HouseholdMember[];
};

export default function FamilyTreeView({ members }: Props) {
  const t = useTranslations("households.detail.tree");

  // Build tree structure from members
  const treeStructure = useMemo(() => {
    if (members.length === 0) return null;

    // Find head of household
    const head = members.find((m) => m.relationship === "head");
    if (!head) return null;

    // Organize members by relationship
    const spouse = members.find((m) => m.relationship === "spouse");
    const children = members.filter((m) => m.relationship === "child");
    const parents = members.filter((m) => m.relationship === "parent");
    const siblings = members.filter((m) => m.relationship === "sibling");
    const others = members.filter((m) => m.relationship === "other");

    return {
      head,
      spouse,
      children,
      parents,
      siblings,
      others,
    };
  }, [members]);

  if (!treeStructure) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="text-center py-8 text-gray-500">
          <Users className="size-12 mx-auto mb-3 text-gray-400" />
          <p>{t("noData")}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "at_home":
        return <Home className="size-3 text-green-600" />;
      case "away":
        return <UserX className="size-3 text-yellow-600" />;
      case "deceased":
        return <UserX className="size-3 text-gray-400" />;
      default:
        return <User className="size-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "at_home":
        return "border-green-200 bg-green-50";
      case "away":
        return "border-yellow-200 bg-yellow-50";
      case "deceased":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const MemberCard = ({ member, isHead = false }: { member: HouseholdMember; isHead?: boolean }) => {
    const relationshipLabels: Record<MemberRelationship, string> = {
      head: t("relationships.head"),
      spouse: t("relationships.spouse"),
      child: t("relationships.child"),
      parent: t("relationships.parent"),
      sibling: t("relationships.sibling"),
      other: t("relationships.other"),
    };

    return (
      <div
        className={`
          relative rounded-lg border-2 p-3 min-w-[160px] max-w-[200px] text-center
          ${isHead ? "border-blue-500 bg-blue-50 shadow-md" : getStatusColor(member.status)}
          transition-all hover:shadow-md
        `}
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          {getStatusIcon(member.status)}
          {member.dependency_status === "dependent" && (
            <Baby className="size-3 text-orange-600" />
          )}
        </div>
        <div className="font-semibold text-sm text-gray-900 mb-1 truncate" title={member.name}>
          {member.name}
        </div>
        {member.ic_number && (
          <div className="text-xs text-gray-600 mb-1">{member.ic_number}</div>
        )}
        <div className="text-xs font-medium text-gray-700 mb-1">
          {relationshipLabels[member.relationship]}
        </div>
        {member.date_of_birth && (
          <div className="text-xs text-gray-500">
            {(() => {
              const date = new Date(member.date_of_birth);
              return date.toLocaleDateString("en-MY", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            })()}
          </div>
        )}
        {member.status === "deceased" && (
          <div className="text-xs text-gray-500 mt-1">†</div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="size-5" />
          {t("title")}
        </h2>
        <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px] py-4">
          {/* Parents Section */}
          {treeStructure.parents.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-center gap-4 flex-wrap">
                {treeStructure.parents.map((parent) => (
                  <MemberCard key={parent.id} member={parent} />
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <div className="h-8 w-0.5 bg-gray-300"></div>
              </div>
            </div>
          )}

          {/* Head and Spouse Section */}
          <div className="flex justify-center items-center gap-6 mb-8">
            {/* Siblings on the left */}
            {treeStructure.siblings.length > 0 && (
              <div className="flex flex-col gap-4">
                {treeStructure.siblings.map((sibling) => (
                  <MemberCard key={sibling.id} member={sibling} />
                ))}
              </div>
            )}

            {/* Head and Spouse */}
            <div className="flex items-center gap-4">
              <MemberCard member={treeStructure.head} isHead={true} />
              {treeStructure.spouse && (
                <>
                  <div className="h-0.5 w-8 bg-gray-400"></div>
                  <MemberCard member={treeStructure.spouse} />
                </>
              )}
            </div>

            {/* Siblings on the right (if no left siblings) */}
            {treeStructure.siblings.length > 0 && treeStructure.siblings.length > 3 && (
              <div className="flex flex-col gap-4">
                {treeStructure.siblings.slice(3).map((sibling) => (
                  <MemberCard key={sibling.id} member={sibling} />
                ))}
              </div>
            )}
          </div>

          {/* Connection line from head/spouse to children */}
          {treeStructure.children.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="h-8 w-0.5 bg-gray-300"></div>
            </div>
          )}

          {/* Children Section */}
          {treeStructure.children.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-center gap-4 flex-wrap">
                {treeStructure.children.map((child) => (
                  <MemberCard key={child.id} member={child} />
                ))}
              </div>
            </div>
          )}

          {/* Others Section */}
          {treeStructure.others.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                {t("otherRelationships")}
              </h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {treeStructure.others.map((other) => (
                  <MemberCard key={other.id} member={other} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Home className="size-4 text-green-600" />
            <span>{t("legend.atHome")}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="size-4 text-yellow-600" />
            <span>{t("legend.away")}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="size-4 text-gray-400" />
            <span>{t("legend.deceased")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Baby className="size-4 text-orange-600" />
            <span>{t("legend.dependent")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
