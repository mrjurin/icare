"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";
import type { ElementType } from "react";
import { LayoutDashboard, FileText, Users, Megaphone, ChartPie, Settings, Bell, UserCog, Home, MapPin, UserCheck, Building2 } from "lucide-react";

type NavItem = { href: string; label: string; icon: ElementType };
const items: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/issues", label: "Issues", icon: FileText },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/households", label: "Households", icon: Home },
  { href: "/admin/zones", label: "Zones", icon: MapPin },
  { href: "/admin/villages", label: "Villages", icon: Building2 },
  { href: "/admin/staff", label: "Staff", icon: UserCog },
  { href: "/admin/roles", label: "Roles", icon: UserCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/reports", label: "Reports", icon: ChartPie },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
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
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
