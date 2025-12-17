import { getSetting, getDunName } from "@/lib/actions/settings";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { FileText, ArrowRight, Eye } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function ViewReportsPage() {
  const t = await getTranslations("viewReports");
  const dunName = await getDunName();
  const contentResult = await getSetting("page_view_reports_content");
  const content = contentResult.success && contentResult.data 
    ? contentResult.data 
    : `# View Reports

## Community Issue Reports

Stay informed about issues reported in your community. Browse through active reports, see their status, and track their progress.

### Report Categories

- **Infrastructure**: Roads, bridges, public facilities
- **Environment**: Waste management, pollution, green spaces
- **Safety**: Security concerns, lighting, hazards
- **Services**: Utilities, public services, amenities
- **Other**: Any other community concerns

### Report Status

- **Open**: Newly reported issues awaiting review
- **Under Review**: Issues being assessed by authorities
- **In Progress**: Active work being done to resolve the issue
- **Resolved**: Issues that have been successfully addressed
- **Closed**: Issues that have been completed or are no longer relevant

Browse reports to see what's happening in your community and how you can help.`;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700 p-8 md:p-12 lg:p-16">
              {/* Illustration Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80"
                  alt="Reports and documents illustration"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <FileText className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {t("hero.description", { dunName })}
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <Button asChild variant="outline" className="!bg-white !text-green-600 !border-0 h-12 px-6 text-base font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    <Link href="/community/login" className="flex items-center gap-2">
                      <Eye className="size-5" />
                      {t("hero.viewReports")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg h-12 px-6 border-2 border-white text-white hover:bg-white/10 transition-all">
                    <Link href="/report-issue" className="flex items-center gap-2">
                      {t("hero.reportIssue")}
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
          <div className="mb-8">
            <MarkdownContent content={content} />
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
              <Link href="/community/login">{t("buttons.loginToView")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/report-issue">{t("buttons.reportIssue")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
