import { getSetting, getDunName } from "@/lib/actions/settings";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Phone, Mail, ArrowRight, MessageCircle } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const dunName = await getDunName();
  const contentResult = await getSetting("page_contact_content");
  const carelineResult = await getSetting("careline_phone");
  const whatsappResult = await getSetting("whatsapp_link");
  
  const content = contentResult.success && contentResult.data 
    ? contentResult.data 
    : `# Contact Us

## Get in Touch

We're here to help! Reach out to us through any of the following channels.

### CARELINE
For urgent matters and general inquiries, contact our CARELINE.

### WhatsApp
Connect with us on WhatsApp for quick responses and support.

### Office Hours
Monday - Friday: 9:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM
Sunday: Closed

### Visit Us
N.18 Inanam Community Platform
Inanam, Sabah, Malaysia

We value your feedback and are committed to improving our services.`;

  const carelinePhone = carelineResult.success && carelineResult.data 
    ? carelineResult.data 
    : "+60 18-181 8181";
    
  const whatsappLink = whatsappResult.success && whatsappResult.data 
    ? whatsappResult.data 
    : "https://wa.me/60181818181";

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 dark:from-orange-600 dark:via-orange-700 dark:to-red-700 p-8 md:p-12 lg:p-16">
              {/* Illustration Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
                  alt="Customer support and communication illustration"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <Phone className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {t("hero.description")}
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <Button asChild variant="outline" className="!bg-white !text-orange-600 !border-0 h-12 px-6 text-base font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    <Link href={`tel:${carelinePhone.replace(/\s/g, '')}`} className="flex items-center gap-2">
                      <Phone className="size-5" />
                      {t("hero.callCareline")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg h-12 px-6 border-2 border-white text-white hover:bg-white/10 transition-all">
                    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <MessageCircle className="size-5" />
                      {t("hero.whatsappUs")}
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
            <MarkdownContent content={content} className="mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">CARELINE</h3>
                <a 
                  href={`tel:${carelinePhone.replace(/\s/g, '')}`}
                  className="text-primary hover:underline text-lg font-medium"
                >
                  {carelinePhone}
                </a>
              </div>
              
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">WhatsApp</h3>
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-lg font-medium"
                >
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
              <Link href="/report-issue">{t("buttons.reportIssue")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/community/login">{t("buttons.loginRegister")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
