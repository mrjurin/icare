import Link from "next/link";
import Button from "@/components/ui/Button";
import { AlertCircle, ArrowRight, FileText, MapPin, CheckCircle2 } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { getTranslations } from "next-intl/server";
import { getDunName } from "@/lib/actions/settings";
import Image from "next/image";

export default async function ReportIssuePage() {
  const t = await getTranslations("reportIssue");
  const dunName = await getDunName();

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-pink-600 dark:from-red-600 dark:via-red-700 dark:to-pink-700 p-8 md:p-12 lg:p-16">
              {/* Illustration Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80"
                  alt="Community reporting illustration"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <AlertCircle className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {t("hero.description", { dunName })}
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <Button asChild className="!rounded-lg !h-12 !px-6 !bg-white !text-red-600 !text-base !font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    <Link href="/community/login" className="flex items-center gap-2">
                      {t("hero.loginToReport")}
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="!rounded-lg !h-12 !px-6 !border-2 !border-white !text-white hover:!bg-white/10 transition-all">
                    <Link href="/community/register" className="flex items-center gap-2">
                      {t("hero.createAccount")}
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="w-full max-w-4xl px-4 md:px-0 py-10 md:py-20">
          <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-800 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("getStarted.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("getStarted.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
                <Link href="/community/login">{t("getStarted.loginToReport")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg h-12 px-5">
                <Link href="/community/register">{t("getStarted.createAccount")}</Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 hover:shadow-lg transition-all">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                <FileText className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("steps.describe.title")}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("steps.describe.description")}
              </p>
            </div>
            
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 hover:shadow-lg transition-all">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit">
                <MapPin className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("steps.addLocation.title")}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("steps.addLocation.description")}
              </p>
            </div>
            
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 hover:shadow-lg transition-all">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit">
                <CheckCircle2 className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("steps.trackProgress.title")}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("steps.trackProgress.description")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
