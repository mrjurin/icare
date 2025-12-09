"use client";
import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import styles from "./layout.module.css";
import type { ElementType } from "react";
import { LayoutDashboard, FileText, Users, Megaphone, ChartPie, Settings, Bell, UserCog, Home, MapPin, UserCheck, Building2, FileEdit, Package, Vote, Database, HardDrive, UserPlus } from "lucide-react";

type NavItem = { href: string; labelKey: string; icon: ElementType };
const items: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/issues", labelKey: "issues", icon: FileText },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { href: "/admin/households", labelKey: "households", icon: Home },
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
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${active ? styles.linkActive : ""}`}
          >
            <item.icon aria-hidden className="size-4" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
