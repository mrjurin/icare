import { getSetting } from "@/lib/actions/settings";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import PublicHeaderClient from "./PublicHeaderClient";

export default async function PublicHeader() {
  const appNameResult = await getSetting("app_name");
  const appName = appNameResult.success && appNameResult.data 
    ? appNameResult.data 
    : "N.18 Inanam Platform";

  return <PublicHeaderClient appName={appName} />;
}
