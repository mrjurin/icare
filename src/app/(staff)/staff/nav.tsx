"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";
import type { ElementType } from "react";
import { LayoutDashboard, FileText, Bell, MapPin, User, Package } from "lucide-react";

type NavItem = { href: string; label: string; icon: ElementType };
const items: NavItem[] = [
  { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/aids-programs", label: "AIDS Programs", icon: Package },
  { href: "/staff/issues", label: "My Issues", icon: FileText },
  { href: "/staff/notifications", label: "Notifications", icon: Bell },
  { href: "/staff/zone", label: "My Zone", icon: MapPin },
  { href: "/staff/profile", label: "Profile", icon: User },
];

export default function StaffNav() {
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
