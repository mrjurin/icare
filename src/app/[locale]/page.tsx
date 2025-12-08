import { getSetting } from "@/lib/actions/settings";
import HomeClient from "../../app/HomeClient";

export default async function Home() {
  const appNameResult = await getSetting("app_name");
  const appName = appNameResult.success && appNameResult.data 
    ? appNameResult.data 
    : "N.18 Inanam Platform";

  return <HomeClient appName={appName} />;
}
