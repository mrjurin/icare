"use client";

import { useState, useMemo, useCallback } from "react";
import { Users, Home, UserX, Baby, User, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { HouseholdMember, MemberRelationship, Household } from "@/lib/actions/households";
import { useTranslations } from "next-intl";
import Link from "next/link";

type TreeNode = {
  member: HouseholdMember & { household?: Household };
  children: TreeNode[];
  parents: TreeNode[];
  siblings: TreeNode[];
  level: number;
  expanded: boolean;
  householdId: number;
};

type Props = {
  members: HouseholdMember[];
  households: Household[];
  startingHouseholdId: number;
};

export default function ExpandableFamilyTreeView({ members, households, startingHouseholdId }: Props) {
  const t = useTranslations("households.detail.tree");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([startingHouseholdId]));

  // Build tree structure with relationships
  const treeStructure = useMemo(() => {
    if (members.length === 0) return null;

    const householdMap = new Map<number, Household>();
    households.forEach((h) => householdMap.set(h.id, h));

    // Add household info to members
    const membersWithHousehold = members.map((m) => ({
      ...m,
      household: householdMap.get(m.household_id),
    }));

    // Find head of starting household
    const startingHead = membersWithHousehold.find(
      (m) => m.household_id === startingHouseholdId && m.relationship === "head"
    );

    if (!startingHead) {
      // If no head, use first member
      const firstMember = membersWithHousehold.find((m) => m.household_id === startingHouseholdId);
      if (!firstMember) return null;
      return buildTreeFromMember(firstMember, membersWithHousehold, 0, new Set());
    }

    return buildTreeFromMember(startingHead, membersWithHousehold, 0, new Set());
  }, [members, households, startingHouseholdId]);

  function buildTreeFromMember(
    member: HouseholdMember & { household?: Household },
    allMembers: Array<HouseholdMember & { household?: Household }>,
    level: number,
    visited: Set<number> = new Set()
  ): TreeNode {
    // Prevent infinite loops
    if (visited.has(member.id)) {
      return {
        member,
        children: [],
        parents: [],
        siblings: [],
        level,
        expanded: false,
        householdId: member.household_id,
      };
    }

    const newVisited = new Set(visited);
    newVisited.add(member.id);

    const node: TreeNode = {
      member,
      children: [],
      parents: [],
      siblings: [],
      level,
      expanded: expandedNodes.has(member.household_id),
      householdId: member.household_id,
    };

    // Normalize IC number for matching
    const normalizeIc = (ic: string | null) => {
      if (!ic) return null;
      return ic.replace(/[\s-]/g, "").toUpperCase();
    };

    const memberIc = normalizeIc(member.ic_number);

    // Find children (direct children in same household)
    const directChildren = allMembers.filter(
      (m) => m.household_id === member.household_id && m.relationship === "child" && m.id !== member.id
    );

    // Find children in other households - if this person is a parent/head, look for children
    // by checking if other households have members with this person's IC as a parent reference
    // For now, we'll use IC matching to find potential children (same surname pattern)
    const relatedChildren = allMembers.filter((m) => {
      if (m.household_id === member.household_id) return false;
      if (m.relationship !== "child") return false;
      // If IC numbers match partially (same family), include them
      // This is a simplified approach - in reality you'd need better matching
      return false; // Disabled for now to avoid false matches
    });

    node.children = [...directChildren, ...relatedChildren]
      .filter((m) => !visited.has(m.id))
      .map((m) => buildTreeFromMember(m, allMembers, level + 1, newVisited));

    // Find parents (direct parents in same household)
    const directParents = allMembers.filter(
      (m) => m.household_id === member.household_id && m.relationship === "parent" && m.id !== member.id
    );

    // Find parents in other households - if this person is a child, look for parents
    // by checking other households for head/parent members
    const relatedParents = allMembers.filter((m) => {
      if (m.household_id === member.household_id) return false;
      if (m.relationship !== "parent" && m.relationship !== "head") return false;
      // Could match by IC or name patterns
      return false; // Disabled for now
    });

    node.parents = [...directParents, ...relatedParents]
      .filter((m) => !visited.has(m.id))
      .map((m) => buildTreeFromMember(m, allMembers, Math.max(0, level - 1), newVisited));

    // Find siblings (direct siblings in same household)
    const directSiblings = allMembers.filter(
      (m) => m.household_id === member.household_id && m.relationship === "sibling" && m.id !== member.id
    );

    // Find siblings in other households - same parents
    const relatedSiblings = allMembers.filter((m) => {
      if (m.household_id === member.household_id) return false;
      if (m.relationship !== "sibling") return false;
      return false; // Would need parent matching
    });

    node.siblings = [...directSiblings, ...relatedSiblings]
      .filter((m) => !visited.has(m.id))
      .map((m) => buildTreeFromMember(m, allMembers, level, newVisited));

    return node;
  }

  const toggleNode = useCallback((householdId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(householdId)) {
        next.delete(householdId);
      } else {
        next.add(householdId);
      }
      return next;
    });
  }, []);

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

  const relationshipLabels: Record<MemberRelationship, string> = {
    head: t("relationships.head"),
    spouse: t("relationships.spouse"),
    child: t("relationships.child"),
    parent: t("relationships.parent"),
    sibling: t("relationships.sibling"),
    other: t("relationships.other"),
  };

  const MemberCard = ({
    node,
    isHead = false,
    onClick,
  }: {
    node: TreeNode;
    isHead?: boolean;
    onClick?: () => void;
  }) => {
    const hasChildren = node.children.length > 0 || node.siblings.length > 0;
    const isExpanded = expandedNodes.has(node.householdId);

    return (
      <div className="flex flex-col items-center">
        <div
          className={`
            relative rounded-lg border-2 p-3 min-w-[160px] max-w-[200px] text-center cursor-pointer
            ${isHead ? "border-blue-500 bg-blue-50 shadow-md" : getStatusColor(node.member.status)}
            transition-all hover:shadow-md
            ${onClick ? "hover:scale-105" : ""}
          `}
          onClick={onClick}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            {getStatusIcon(node.member.status)}
            {node.member.dependency_status === "dependent" && <Baby className="size-3 text-orange-600" />}
          </div>
          <div className="font-semibold text-sm text-gray-900 mb-1 truncate" title={node.member.name}>
            {node.member.name}
          </div>
          {node.member.ic_number && (
            <div className="text-xs text-gray-600 mb-1">{node.member.ic_number}</div>
          )}
          <div className="text-xs font-medium text-gray-700 mb-1">
            {relationshipLabels[node.member.relationship]}
          </div>
          {node.member.date_of_birth && (
            <div className="text-xs text-gray-500">
              {(() => {
                const date = new Date(node.member.date_of_birth);
                return date.toLocaleDateString("en-MY", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
              })()}
            </div>
          )}
          {node.member.status === "deceased" && <div className="text-xs text-gray-500 mt-1">†</div>}
          {node.householdId !== startingHouseholdId && (
            <Link
              href={`/admin/households/${node.householdId}`}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3" />
              View Household
            </Link>
          )}
          {hasChildren && (
            <div className="mt-2 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="size-4 text-gray-600" />
              ) : (
                <ChevronRight className="size-4 text-gray-600" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTree = (node: TreeNode, isRoot = false): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.householdId);
    const hasChildren = node.children.length > 0;
    const hasSiblings = node.siblings.length > 0;
    const hasParents = node.parents.length > 0;

    return (
      <div key={node.member.id} className="flex flex-col items-center">
        {/* Parents */}
        {hasParents && isRoot && (
          <div className="mb-8">
            <div className="flex justify-center gap-4 flex-wrap">
              {node.parents.map((parent) => (
                <MemberCard
                  key={parent.member.id}
                  node={parent}
                  onClick={() => toggleNode(parent.householdId)}
                />
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <div className="h-8 w-0.5 bg-gray-300"></div>
            </div>
          </div>
        )}

        {/* Current node */}
        <div className="flex items-center gap-6 mb-8">
          {/* Siblings */}
          {hasSiblings && isRoot && (
            <div className="flex flex-col gap-4">
              {node.siblings.map((sibling) => (
                <MemberCard
                  key={sibling.member.id}
                  node={sibling}
                  onClick={() => toggleNode(sibling.householdId)}
                />
              ))}
            </div>
          )}

          {/* Main node */}
          <MemberCard node={node} isHead={isRoot} onClick={() => hasChildren && toggleNode(node.householdId)} />

          {/* Spouse */}
          {isRoot && node.member.relationship === "head" && (
            <>
              <div className="h-0.5 w-8 bg-gray-400"></div>
              {members
                .filter(
                  (m) =>
                    m.household_id === node.householdId &&
                    m.relationship === "spouse" &&
                    m.id !== node.member.id
                )
                .map((spouse) => {
                  const spouseNode: TreeNode = {
                    member: spouse,
                    children: [],
                    parents: [],
                    siblings: [],
                    level: node.level,
                    expanded: false,
                    householdId: spouse.household_id,
                  };
                  return <MemberCard key={spouse.id} node={spouseNode} />;
                })}
            </>
          )}
        </div>

        {/* Connection line */}
        {hasChildren && (
          <div className="flex justify-center mb-4">
            <div className="h-8 w-0.5 bg-gray-300"></div>
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-4">
            <div className="flex justify-center gap-4 flex-wrap">
              {node.children.map((child) => renderTree(child, false))}
            </div>
          </div>
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
        <p className="text-xs text-gray-500 mt-2">
          Click on a person to expand/collapse their family tree
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px] py-4">{renderTree(treeStructure, true)}</div>
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
