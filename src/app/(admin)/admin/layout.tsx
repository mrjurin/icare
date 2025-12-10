import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import styles from "./layout.module.css";
import AdminNav from "./nav";
import LogoutButton from "./LogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationIcon from "@/components/NotificationIcon";
import { getCurrentUserAccessReadOnly, getWorkspaceAccess } from "@/lib/utils/access-control";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/actions/settings";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Check workspace access
  const workspaceAccess = await getWorkspaceAccess();
  
  // Only allow admin workspace access
  if (!workspaceAccess.canAccessAdmin) {
    // Redirect based on user's actual workspace
    if (workspaceAccess.canAccessStaff) {
      redirect("/staff/dashboard");
    } else if (workspaceAccess.canAccessCommunity) {
      redirect("/community/dashboard");
    } else {
      redirect("/admin/login");
    }
  }

  // Check authentication and staff status using read-only client
  const access = await getCurrentUserAccessReadOnly();

  // Redirect to login if not authenticated or not a staff member
  if (!access.isAuthenticated || !access.staffId) {
    redirect("/admin/login");
  }

  // Get staff details for display using read-only client
  const supabase = await getSupabaseReadOnlyClient();
  const { data: staffData } = await supabase
    .from("staff")
    .select("name, role, position")
    .eq("id", access.staffId)
    .single();

  const staffName = staffData?.name || "Admin";
  const staffRole = staffData?.role || "staff";
  const staffPosition = staffData?.position || "Staff Member";

  // Get configured settings
  const [titleResult, appNameResult] = await Promise.all([
    getSetting("admin_header_title"),
    getSetting("app_name"),
  ]);
  const adminHeaderTitle = titleResult.success && titleResult.data 
    ? titleResult.data 
    : "N.18 Inanam Community Watch";
  const appName = appNameResult.success && appNameResult.data 
    ? appNameResult.data 
    : "Community Watch";

  // Get messages for intl provider
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className={styles.shell}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <div style={{ width: 20, height: 20, color: "var(--primary)" }}>
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
              </svg>
            </div>
            <span>{appName}</span>
          </div>
          <div className={styles.navPad}>
            <AdminNav />
          </div>
          <div className={styles.account}>
            <div className={styles.accountRow}>
              <div className="size-8 rounded-full bg-gray-200" />
              <div>
                <p className="text-sm font-medium">{staffName}</p>
                <p className="text-xs text-gray-600">{staffPosition}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <LogoutButton />
            </div>
          </div>
        </aside>
        <div className={styles.mainWrap}>
          <header className={styles.topbar}>
            <div className={styles.brandRow}>
              <span style={{ fontWeight: 600 }}>{adminHeaderTitle}</span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationIcon href="/admin/notifications" />
              <LanguageSwitcher />
            </div>
          </header>
          <main className={styles.main}>{children}</main>
        </div>
      </div>
      </div>
    </NextIntlClientProvider>
  );
}
