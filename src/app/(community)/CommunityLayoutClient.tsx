"use client";
import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./layout.module.css";
import Button from "@/components/ui/Button";
import NotificationIcon from "@/components/NotificationIcon";

export default function CommunityLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName: string | null; avatarUrl: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Fetch user profile from session
  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        // Get authenticated user from session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user || !user.email) {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        // Fetch profile using the authenticated user's email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();

        if (profileError || !profile) {
          // If profile not found, use auth user data as fallback
          setUserProfile({
            fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            avatarUrl: null,
            email: user.email,
          });
        } else {
          setUserProfile({
            fullName: profile.full_name || user.email?.split("@")[0] || "User",
            avatarUrl: profile.avatar_url,
            email: profile.email || user.email,
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    closeSidebar();
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();
    router.push("/community/login");
    router.refresh();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brandRow}>
          <button
            onClick={toggleSidebar}
            className={styles.menuButton}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-6" />
          </button>
          <div style={{ width: 20, height: 20, color: "var(--primary)" }}>
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
              <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <span style={{ fontWeight: 700 }}>N.18 Inanam Community Hub</span>
        </div>
        <div className={styles.topbarActions}>
          <NotificationIcon href="/community/notifications" />
          <Button asChild className={styles.reportBtn}>
            <Link href="/community/report">Report a New Issue</Link>
          </Button>
          {userProfile?.avatarUrl ? (
            <Image className={styles.avatar} alt="User" src={userProfile.avatarUrl} width={40} height={40} />
          ) : (
            <div className={styles.avatar} style={{ 
              width: 40, 
              height: 40, 
              borderRadius: "50%", 
              backgroundColor: "var(--primary)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px"
            }}>
              {userProfile?.fullName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} aria-hidden="true" />
      )}

      <div className={styles.body}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <div className={styles.sideUserRow}>
                {loading ? (
                  <div className={styles.avatar} style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: "50%", 
                    backgroundColor: "#e5e7eb",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center"
                  }} />
                ) : userProfile?.avatarUrl ? (
                  <Image className={styles.avatar} alt="User" src={userProfile.avatarUrl} width={40} height={40} />
                ) : (
                  <div className={styles.avatar} style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: "50%", 
                    backgroundColor: "var(--primary)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "16px"
                  }}>
                    {userProfile?.fullName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <p className={styles.sideUserName}>
                    {loading ? "Loading..." : (userProfile?.fullName || "User")}
                  </p>
                  <p className={styles.sideUserRole}>Resident</p>
                </div>
              </div>
              <button
                onClick={closeSidebar}
                className={styles.closeButton}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className={styles.sideNav}>
              <Link className={`${styles.sideLink} ${pathname === "/community/dashboard" ? styles.sideLinkActive : ""}`} href="/community/dashboard" onClick={closeSidebar}>Dashboard</Link>
              <Link className={`${styles.sideLink} ${pathname === "/community/report" ? styles.sideLinkActive : ""}`} href="/community/report" onClick={closeSidebar}>Report a New Issue</Link>
              <Link className={styles.sideLink} href="#" onClick={closeSidebar}>Community Updates</Link>
              <Link className={`${styles.sideLink} ${pathname === "/community/profile" ? styles.sideLinkActive : ""}`} href="/community/profile" onClick={closeSidebar}>My Profile</Link>
            </div>
            <div className={styles.sideMeta}>
              <Link className={`${styles.sideLink} ${pathname === "/community/faq" ? styles.sideLinkActive : ""}`} href="/community/faq" onClick={closeSidebar}>FAQ</Link>
              <Link className={`${styles.sideLink} ${pathname === "/community/support" ? styles.sideLinkActive : ""}`} href="/community/support" onClick={closeSidebar}>Contact Support</Link>
              <Link className={styles.sideLink} href="#" onClick={handleLogout}>Logout</Link>
            </div>
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}