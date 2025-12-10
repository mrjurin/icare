"use client";

import { useState, useMemo, useCallback } from "react";
import { Users, Home, UserX, Baby, User, ChevronDown, ChevronRight, ChevronUp, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
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
  relationshipPath?: string[]; // Path showing how this person is related
};

type Props = {
  members: HouseholdMember[];
  households: Household[];
  startingHouseholdId: number;
};

export default function ImprovedFamilyTreeView({ members, households, startingHouseholdId }: Props) {
  const t = useTranslations("households.detail.tree");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([startingHouseholdId]));
  const [highlightedPath, setHighlightedPath] = useState<Set<number>>(new Set());

  // Normalize IC helper
  const normalizeIc = useCallback((ic: string | null) => {
    if (!ic) return null;
    return ic.replace(/[\s-]/g, "").toUpperCase();
  }, []);

  // Build relationship map: who is related to whom
  const relationshipMap = useMemo(() => {
    const map = new Map<number, {
      parents: HouseholdMember[];
      children: HouseholdMember[];
      siblings: HouseholdMember[];
    }>();

    members.forEach((member) => {
      if (!map.has(member.id)) {
        map.set(member.id, { parents: [], children: [], siblings: [] });
      }
    });

    // Build relationships based on:
    // 1. Direct relationships in same household
    // 2. IC number matching across households
    // 3. Name matching (for same family)

    members.forEach((member) => {
      const memberIc = normalizeIc(member.ic_number);
      const memberData = map.get(member.id)!;

      // Track added IDs to prevent duplicates
      const addedParentIds = new Set<number>();
      const addedChildIds = new Set<number>();
      const addedSiblingIds = new Set<number>();

      // Find direct relationships in same household
      members.forEach((other) => {
        if (other.id === member.id) return;

        // Same household relationships
        if (other.household_id === member.household_id) {
          if (other.relationship === "parent" && member.relationship === "child" && !addedParentIds.has(other.id)) {
            memberData.parents.push(other);
            addedParentIds.add(other.id);
          }
          if (other.relationship === "child" && (member.relationship === "parent" || member.relationship === "head") && !addedChildIds.has(other.id)) {
            memberData.children.push(other);
            addedChildIds.add(other.id);
          }
          if (other.relationship === "sibling" && !addedSiblingIds.has(other.id)) {
            memberData.siblings.push(other);
            addedSiblingIds.add(other.id);
          }
        }

        // Cross-household relationships by IC matching
        const otherIc = normalizeIc(other.ic_number);
        if (memberIc && otherIc && memberIc === otherIc) {
          // Same person in different household - link relationships
          if (other.relationship === "parent" && member.relationship === "child" && !addedParentIds.has(other.id)) {
            memberData.parents.push(other);
            addedParentIds.add(other.id);
          }
          if (other.relationship === "child" && (member.relationship === "parent" || member.relationship === "head") && !addedChildIds.has(other.id)) {
            memberData.children.push(other);
            addedChildIds.add(other.id);
          }
        }

        // Cross-household: if member is child, find potential parents in other households
        if (member.relationship === "child" && other.household_id !== member.household_id && !addedParentIds.has(other.id)) {
          if (other.relationship === "parent" || other.relationship === "head") {
            // Check if names suggest relationship (same surname pattern)
            // For now, include if IC matches
            if (memberIc && otherIc && memberIc === otherIc) {
              memberData.parents.push(other);
              addedParentIds.add(other.id);
            }
          }
        }

        // Cross-household: if member is parent/head, find potential children
        if ((member.relationship === "parent" || member.relationship === "head") && other.household_id !== member.household_id && !addedChildIds.has(other.id)) {
          if (other.relationship === "child") {
            if (memberIc && otherIc && memberIc === otherIc) {
              memberData.children.push(other);
              addedChildIds.add(other.id);
            }
          }
        }
      });
    });

    return map;
  }, [members, normalizeIc]);

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
      const firstMember = membersWithHousehold.find((m) => m.household_id === startingHouseholdId);
      if (!firstMember) return null;
      return buildTreeFromMember(firstMember, membersWithHousehold, 0, new Set(), []);
    }

    return buildTreeFromMember(startingHead, membersWithHousehold, 0, new Set(), []);
  }, [members, households, startingHouseholdId, relationshipMap]);

  function buildTreeFromMember(
    member: HouseholdMember & { household?: Household },
    allMembers: Array<HouseholdMember & { household?: Household }>,
    level: number,
    visited: Set<number>,
    path: string[]
  ): TreeNode {
    if (visited.has(member.id)) {
      return {
        member,
        children: [],
        parents: [],
        siblings: [],
        level,
        expanded: false,
        householdId: member.household_id,
        relationshipPath: path,
      };
    }

    const newVisited = new Set(visited);
    newVisited.add(member.id);
    const newPath = [...path, member.name];

    const node: TreeNode = {
      member,
      children: [],
      parents: [],
      siblings: [],
      level,
      expanded: expandedNodes.has(member.household_id),
      householdId: member.household_id,
      relationshipPath: newPath,
    };

    const relationships = relationshipMap.get(member.id);
    if (relationships) {
      // Build parent nodes
      node.parents = relationships.parents
        .filter((m) => !visited.has(m.id))
        .map((m) => {
          const parentWithHousehold = allMembers.find((am) => am.id === m.id);
          if (!parentWithHousehold) return null;
          return buildTreeFromMember(parentWithHousehold, allMembers, Math.max(0, level - 1), newVisited, newPath);
        })
        .filter((n): n is TreeNode => n !== null);

      // Build child nodes
      node.children = relationships.children
        .filter((m) => !visited.has(m.id))
        .map((m) => {
          const childWithHousehold = allMembers.find((am) => am.id === m.id);
          if (!childWithHousehold) return null;
          return buildTreeFromMember(childWithHousehold, allMembers, level + 1, newVisited, newPath);
        })
        .filter((n): n is TreeNode => n !== null);

      // Build sibling nodes
      node.siblings = relationships.siblings
        .filter((m) => !visited.has(m.id))
        .map((m) => {
          const siblingWithHousehold = allMembers.find((am) => am.id === m.id);
          if (!siblingWithHousehold) return null;
          return buildTreeFromMember(siblingWithHousehold, allMembers, level, newVisited, newPath);
        })
        .filter((n): n is TreeNode => n !== null);
    }

    return node;
  }

  const toggleNode = useCallback((householdId: number, memberId?: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(householdId)) {
        next.delete(householdId);
      } else {
        next.add(householdId);
      }
      return next;
    });

    // Highlight relationship path
    if (memberId && treeStructure) {
      const findPath = (node: TreeNode, targetId: number, path: number[] = []): number[] | null => {
        if (node.member.id === targetId) return [...path, targetId];
        for (const child of node.children) {
          const result = findPath(child, targetId, [...path, node.member.id]);
          if (result) return result;
        }
        for (const parent of node.parents) {
          const result = findPath(parent, targetId, [...path, node.member.id]);
          if (result) return result;
        }
        return null;
      };

      const path = findPath(treeStructure, memberId);
      if (path) {
        setHighlightedPath(new Set(path));
        setTimeout(() => setHighlightedPath(new Set()), 3000);
      }
    }
  }, [treeStructure]);

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
    showConnection = false,
    isHighlighted = false,
  }: {
    node: TreeNode;
    isHead?: boolean;
    onClick?: () => void;
    showConnection?: boolean;
    isHighlighted?: boolean;
  }) => {
    const hasChildren = node.children.length > 0;
    const hasParents = node.parents.length > 0;
    const isExpanded = expandedNodes.has(node.householdId);
    const isDifferentHousehold = node.householdId !== startingHouseholdId;

    return (
      <div className="flex flex-col items-center relative">
        {/* Connection indicator */}
        {showConnection && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
              {hasParents && <ArrowUp className="size-3" />}
              {hasChildren && <ArrowDown className="size-3" />}
              <span>Related</span>
            </div>
          </div>
        )}

        <div
          className={`
            relative rounded-lg border-2 p-3 min-w-[180px] max-w-[220px] text-center cursor-pointer transition-all
            ${isHead ? "border-blue-500 bg-blue-50 shadow-lg" : getStatusColor(node.member.status)}
            ${isHighlighted ? "ring-4 ring-purple-300 shadow-xl" : ""}
            ${isDifferentHousehold ? "border-dashed border-purple-400 bg-purple-50/50" : ""}
            hover:shadow-lg hover:scale-105
            ${onClick ? "" : "cursor-default"}
          `}
          onClick={onClick}
        >
          {/* Household indicator - clickable */}
          {isDifferentHousehold && (
            <Link
              href={`/admin/households/${node.householdId}`}
              className="absolute -top-2 -right-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-1 transition-colors shadow-md hover:shadow-lg z-10"
              onClick={(e) => e.stopPropagation()}
              title="View this household"
            >
              <ExternalLink className="size-3" />
            </Link>
          )}

          <div className="flex items-center justify-center gap-1 mb-1">
            {getStatusIcon(node.member.status)}
            {node.member.dependency_status === "dependent" && <Baby className="size-3 text-orange-600" />}
          </div>
          
          <div className="font-semibold text-sm text-gray-900 mb-1 truncate" title={node.member.name}>
            {node.member.name}
          </div>
          
          {node.member.ic_number && (
            <div className="text-xs text-gray-600 mb-1 font-mono">{node.member.ic_number}</div>
          )}
          
          <div className="text-xs font-medium text-gray-700 mb-1 px-2 py-0.5 bg-gray-100 rounded">
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
          
          {node.member.status === "deceased" && (
            <div className="text-xs text-gray-500 mt-1">†</div>
          )}

          {/* Expand/Collapse indicator */}
          {(hasChildren || hasParents) && (
            <div className="mt-2 flex items-center justify-center gap-1">
              {hasParents && (
                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.householdId, node.member.id);
                  }}
                  title="Show parents"
                >
                  <ChevronUp className="size-4 text-gray-600" />
                </button>
              )}
              {hasChildren && (
                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.householdId, node.member.id);
                  }}
                  title="Show children"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="size-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* View household link */}
          {isDifferentHousehold && (
            <Link
              href={`/admin/households/${node.householdId}`}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center gap-1 font-medium underline hover:no-underline transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3" />
              View Household
            </Link>
          )}
        </div>

        {/* Relationship path tooltip */}
        {node.relationshipPath && node.relationshipPath.length > 1 && (
          <div className="mt-1 text-xs text-gray-500 max-w-[220px] text-center">
            Path: {node.relationshipPath.slice(0, 3).join(" → ")}
            {node.relationshipPath.length > 3 && "..."}
          </div>
        )}
      </div>
    );
  };

  const renderTree = (node: TreeNode, isRoot = false): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.householdId);
    const hasChildren = node.children.length > 0;
    const hasSiblings = node.siblings.length > 0;
    const hasParents = node.parents.length > 0;
    const isHighlighted = highlightedPath.has(node.member.id);

    return (
      <div key={`node-${node.member.id}-${node.householdId}-${isRoot ? 'root' : 'child'}`} className="flex flex-col items-center">
        {/* Parents Section */}
        {hasParents && (isRoot || isExpanded) && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-2 text-center font-medium">Parents</div>
            <div className="flex justify-center gap-4 flex-wrap">
              {node.parents.map((parent, idx) => (
                <div key={`parent-${parent.member.id}-${parent.householdId}-${idx}`} className="flex flex-col items-center">
                  <MemberCard
                    node={parent}
                    onClick={() => toggleNode(parent.householdId, parent.member.id)}
                    showConnection={true}
                    isHighlighted={highlightedPath.has(parent.member.id)}
                  />
                  {/* Connection line */}
                  <div className="h-6 w-0.5 bg-gray-400 my-2"></div>
                </div>
              ))}
            </div>
            {isRoot && (
              <div className="flex justify-center mt-2">
                <div className="h-8 w-0.5 bg-gray-400"></div>
              </div>
            )}
          </div>
        )}

        {/* Current Node Section */}
        <div className="flex items-center gap-4 mb-6">
          {/* Siblings */}
          {hasSiblings && isRoot && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-500 mb-2 text-center font-medium">Siblings</div>
              {node.siblings.map((sibling, idx) => (
                <MemberCard
                  key={`sibling-${sibling.member.id}-${sibling.householdId}-${idx}`}
                  node={sibling}
                  onClick={() => toggleNode(sibling.householdId, sibling.member.id)}
                  isHighlighted={highlightedPath.has(sibling.member.id)}
                />
              ))}
            </div>
          )}

          {/* Main Node */}
          <div className="flex flex-col items-center">
            <MemberCard
              node={node}
              isHead={isRoot}
              onClick={() => (hasChildren || hasParents) && toggleNode(node.householdId, node.member.id)}
              isHighlighted={isHighlighted}
            />

            {/* Spouse */}
            {isRoot && node.member.relationship === "head" && (
              <>
                <div className="h-0.5 w-12 bg-gray-400 my-4"></div>
              {members
                .filter(
                  (m) =>
                    m.household_id === node.householdId &&
                    m.relationship === "spouse" &&
                    m.id !== node.member.id
                )
                .map((spouse, idx) => {
                  const spouseNode: TreeNode = {
                    member: spouse,
                    children: [],
                    parents: [],
                    siblings: [],
                    level: node.level,
                    expanded: false,
                    householdId: spouse.household_id,
                  };
                  return <MemberCard key={`spouse-${spouse.id}-${spouse.household_id}-${idx}`} node={spouseNode} />;
                })}
              </>
            )}
          </div>
        </div>

        {/* Connection line to children */}
        {hasChildren && (
          <div className="flex justify-center mb-4">
            <div className="h-8 w-0.5 bg-gray-400"></div>
          </div>
        )}

        {/* Children Section */}
        {hasChildren && (isExpanded || isRoot) && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2 text-center font-medium">Children</div>
            <div className="flex justify-center gap-4 flex-wrap">
              {node.children.map((child, idx) => (
                <div key={`child-${child.member.id}-${child.householdId}-${idx}`} className="flex flex-col items-center">
                  {/* Connection line */}
                  <div className="h-6 w-0.5 bg-gray-400 mb-2"></div>
                  {renderTree(child, false)}
                </div>
              ))}
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
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
            <span>Current Household</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-purple-400 bg-purple-50/50 rounded"></div>
            <span>Other Household</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-4 ring-purple-300 border-2 border-gray-200 rounded"></div>
            <span>Highlighted Path</span>
          </div>
        </div>
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
