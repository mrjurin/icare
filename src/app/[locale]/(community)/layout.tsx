import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getWorkspaceAccess } from "@/lib/utils/access-control";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import CommunityLayoutClient from "./CommunityLayoutClient";

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  // Check workspace access
  const workspaceAccess = await getWorkspaceAccess();
  
  // Only allow community workspace access
  if (!workspaceAccess.canAccessCommunity) {
    // Redirect based on user's actual workspace
    if (workspaceAccess.canAccessAdmin) {
      redirect("/admin/dashboard");
    } else if (workspaceAccess.canAccessStaff) {
      redirect("/staff/dashboard");
    } else {
      redirect("/community/login");
    }
  }

  // Get messages for intl provider
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <CommunityLayoutClient>{children}</CommunityLayoutClient>
    </NextIntlClientProvider>
  );
}
