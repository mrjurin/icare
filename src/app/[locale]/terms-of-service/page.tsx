import Link from "next/link";
import Button from "@/components/ui/Button";
import { FileText, ArrowRight } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import MarkdownContent from "@/components/MarkdownContent";
import { getTranslations, getLocale } from "next-intl/server";
import { getSetting, getDunName } from "@/lib/actions/settings";
import Image from "next/image";

export default async function TermsOfServicePage() {
  const t = await getTranslations("termsOfService");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const dunName = await getDunName();
  
  // Try to get custom content from settings first
  const contentResult = await getSetting("page_terms_of_service_content");
  const customContent = contentResult.success && contentResult.data ? contentResult.data : null;
  
  const effectiveDate = new Date().toLocaleDateString(
    locale === 'ms' ? 'ms-MY' : 'en-MY',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  
  // Use custom content from settings if available, otherwise use translation
  const content = customContent || t("content", { effectiveDate, dunName });

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700 p-8 md:p-12 lg:p-16">
              {/* Background Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80"
                  alt="Legal documents and terms"
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
                  {t("title")}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {t("subtitle", { dunName })}
                </p>
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
              <Link href="/privacy-policy" className="flex items-center gap-2">
                {t("readPrivacy")}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/contact">{tNav("contact")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
