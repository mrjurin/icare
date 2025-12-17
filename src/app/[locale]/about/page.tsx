import { getSetting, getDunName } from "@/lib/actions/settings";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Info, ArrowRight, Users } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("about");
  const dunName = await getDunName();
  const contentResult = await getSetting("page_about_us_content");
  const content = contentResult.success && contentResult.data 
    ? contentResult.data 
    : `# About Us

## N.18 Inanam Community Platform

Welcome to the N.18 Inanam Community Platform, the official platform for residents to report local issues and drive community-led solutions.

### Our Mission

We believe in empowering communities to take action. Our platform connects residents with local authorities, making it easy to report issues, track progress, and work together to build a better N.18 Inanam.

### What We Do

- **Issue Reporting**: Simple, accessible way to report community issues
- **Transparency**: Real-time tracking of issue status and resolution
- **Community Engagement**: Connect neighbors and local authorities
- **Accountability**: Ensure issues are addressed and resolved

### Our Values

**Transparency**: We believe in open communication and clear processes.

**Community First**: Every feature is designed with the community's needs in mind.

**Action-Oriented**: We focus on results and real-world impact.

**Collaboration**: We bring together residents, authorities, and stakeholders.

Join us in building a stronger, more connected N.18 Inanam community.`;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700 p-8 md:p-12 lg:p-16">
              {/* Illustration Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80"
                  alt="Team collaboration illustration"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <Info className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {t("hero.description", { dunName })}
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <Button asChild variant="outline" className="!bg-white !text-purple-600 !border-0 h-12 px-6 text-base font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    <Link href="/report-issue" className="flex items-center gap-2">
                      {t("hero.getInvolved")}
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg h-12 px-6 border-2 border-white text-white hover:bg-white/10 transition-all">
                    <Link href="/contact" className="flex items-center gap-2">
                      <Users className="size-5" />
                      {t("hero.contactUs")}
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
              <Link href="/report-issue">{t("buttons.reportIssue")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/contact">{t("buttons.contactUs")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
