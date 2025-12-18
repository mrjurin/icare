"use client";
import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import styles from "./layout.module.css";
import type { ElementType } from "react";
import { useState } from "react";
import { LayoutDashboard, FileText, Users, Megaphone, ChartPie, Settings, Bell, UserCog, Home, MapPin, UserCheck, Building2, FileEdit, Package, Vote, Database, HardDrive, UserPlus, ScrollText, ChevronDown, ChevronRight } from "lucide-react";

type NavSubItem = { href: string; labelKey: string };
type NavItem = 
  | { href: string; labelKey: string; icon: ElementType }
  | { href: string; labelKey: string; icon: ElementType; submenu?: NavSubItem[] };

const items: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/issues", labelKey: "issues", icon: FileText },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { 
    href: "/admin/households", 
    labelKey: "households", 
    icon: Home,
    submenu: [
      { href: "/admin/households", labelKey: "households" },
      { href: "/admin/households/reports", labelKey: "householdReports" },
    ]
  },
  { href: "/admin/spr-voters", labelKey: "sprVoters", icon: Vote },
  { href: "/admin/sprvoter-density-map", labelKey: "sprVoterDensityMap", icon: MapPin },
  { href: "/admin/reference-data", labelKey: "referenceData", icon: Database },
  { href: "/admin/aids-programs", labelKey: "aidsPrograms", icon: Package },
  { href: "/admin/staff", labelKey: "staff", icon: UserCog },
  { href: "/admin/roles", labelKey: "roles", icon: UserCheck },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/memberships", labelKey: "memberships", icon: UserPlus },
  { href: "/admin/announcements", labelKey: "announcements", icon: Megaphone },
  { href: "/admin/reports", labelKey: "reports", icon: ChartPie },
  { href: "/admin/pages", labelKey: "pages", icon: FileEdit },
  { href: "/admin/backups", labelKey: "backups", icon: HardDrive },
  { href: "/admin/audit-logs", labelKey: "auditLogs", icon: ScrollText },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand items if current path matches submenu
    const expanded: string[] = [];
    items.forEach((item) => {
      if ('submenu' in item && item.submenu) {
        const hasActiveSubmenu = item.submenu.some(sub => pathname.startsWith(sub.href));
        if (hasActiveSubmenu) {
          expanded.push(item.href);
        }
      }
    });
    return expanded;
  });

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(h => h !== href)
        : [...prev, href]
    );
  };

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const hasSubmenu = 'submenu' in item && item.submenu;
        const isExpanded = hasSubmenu && expandedItems.includes(item.href);
        
        // Check if any submenu item is active (excluding the parent href itself)
        const activeSubmenuItem = hasSubmenu 
          ? item.submenu?.find(sub => {
              // If submenu href is same as parent, it's not a "submenu" - it's the main item
              if (sub.href === item.href) return false;
              // Check if pathname matches or starts with submenu href
              return pathname === sub.href || pathname.startsWith(sub.href + '/');
            })
          : undefined;
        
        const hasActiveSubmenu = !!activeSubmenuItem;
        
        // Parent is never highlighted if it has a submenu
        // Only highlight if it doesn't have a submenu and pathname matches
        const parentActive = !hasSubmenu && (pathname === item.href || pathname.startsWith(item.href + '/'));

        return (
          <div key={item.href} className={styles.navItem}>
            <div className={styles.navItemHeader}>
              {hasSubmenu ? (
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={`${styles.link} ${parentActive ? styles.linkActive : ""}`}
                >
                  <item.icon aria-hidden className="size-4" />
                  <span>{t(item.labelKey)}</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`${styles.link} ${parentActive ? styles.linkActive : ""}`}
                >
                  <item.icon aria-hidden className="size-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              )}
              {hasSubmenu && (
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={styles.expandButton}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              )}
            </div>
            {hasSubmenu && isExpanded && item.submenu && (
              <div className={styles.submenu}>
                {item.submenu.map((subItem) => {
                  // Submenu is active if pathname exactly matches or starts with it
                  // But if it's the same as parent href, only highlight if exact match
                  const subActive = subItem.href === item.href
                    ? pathname === subItem.href
                    : pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                  
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`${styles.submenuLink} ${subActive ? styles.submenuLinkActive : ""}`}
                    >
                      <span>{t(subItem.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
