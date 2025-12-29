"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicHeaderClient from "@/components/PublicHeaderClient";
import MarkdownContent from "@/components/MarkdownContent";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import { 
  FileText, 
  Shield, 
  HelpCircle, 
  Info, 
  ArrowRight, 
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Megaphone
} from "lucide-react";
import { type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { getBlockType } from "@/lib/types/page-builder";

interface DynamicPageRendererProps {
  pageTitle: string;
  pageDescription?: string;
  blocks: ContentBlockWithTranslations[];
  locale: string;
  appName: string;
  announcements?: any[]; // Add announcements prop
}

// Icon mapping for different page types
const getPageIcon = (pageType: string) => {
  switch (pageType) {
    case 'terms': return FileText;
    case 'privacy': return Shield;
    case 'how-it-works': return HelpCircle;
    case 'about': return Info;
    case 'contact': return Phone;
    default: return Info;
  }
};

// Color scheme mapping for different page types
const getPageColors = (pageType: string) => {
  switch (pageType) {
    case 'terms': 
      return {
        gradient: 'from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700',
        iconColor: 'text-green-600'
      };
    case 'privacy': 
      return {
        gradient: 'from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700',
        iconColor: 'text-blue-600'
      };
    case 'how-it-works': 
      return {
        gradient: 'from-blue-500 via-blue-600 to-primary dark:from-blue-600 dark:via-blue-700 dark:to-primary',
        iconColor: 'text-primary'
      };
    case 'about': 
      return {
        gradient: 'from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700',
        iconColor: 'text-purple-600'
      };
    case 'contact': 
      return {
        gradient: 'from-orange-500 via-orange-600 to-red-600 dark:from-orange-600 dark:via-orange-700 dark:to-red-700',
        iconColor: 'text-orange-600'
      };
    default: 
      return {
        gradient: 'from-gray-500 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800',
        iconColor: 'text-gray-600'
      };
  }
};

// Block renderer components
const HeroBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  const config = block.configuration ? JSON.parse(block.configuration) : {};
  const pageType = config.pageType || 'default';
  
  // For landing page, use a different hero style
  if (pageType === 'landing') {
    return (
      <section className="py-6 md:py-8 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-full px-6 md:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 p-6 md:p-8 lg:p-12 border border-primary/20 dark:border-primary/30 shadow-xl">
            {/* Background Image */}
            {content.backgroundImage && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={content.backgroundImage}
                  alt="Community"
                  fill
                  className="object-cover opacity-20 dark:opacity-10"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10"></div>
              </div>
            )}
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">
                {content.title}
              </h1>
              {content.subtitle && (
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  {content.subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-4 justify-center mt-6">
                {content.primaryButton && content.primaryButtonUrl && (
                  <Button asChild className="rounded-xl h-12 md:h-14 px-6 md:px-8 bg-primary text-white text-base md:text-lg font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                    <Link href={content.primaryButtonUrl} className="flex items-center gap-2">
                      {content.primaryButton}
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                )}
                {content.secondaryButton && content.secondaryButtonUrl && (
                  <Button asChild variant="outline" className="rounded-xl h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105 hover:border-primary/50 dark:hover:border-primary/50">
                    <Link href={content.secondaryButtonUrl} className="flex items-center gap-2">
                      {content.secondaryButton}
                      <Eye className="size-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default hero for other page types
  const colors = getPageColors(pageType);
  const IconComponent = getPageIcon(pageType);

  return (
    <section className="w-full py-6 md:py-8 lg:py-12">
      <div className="w-full px-6 md:px-8 lg:px-12">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.gradient} p-8 md:p-12 lg:p-16`}>
          {/* Background Image */}
          {content.backgroundImage && (
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <Image
                src={content.backgroundImage}
                alt={content.title || "Background"}
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          )}
          
          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <IconComponent className="size-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                {content.subtitle}
              </p>
            )}
            {content.ctaText && content.ctaLink && (
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <Button asChild variant="outline" className="!bg-white !text-primary !border-0 h-12 px-6 text-base font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                  <Link href={content.ctaLink} className="flex items-center gap-2">
                    {content.ctaText}
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const TextBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6 md:py-8">
      <div className="mb-8">
        {content.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {content.title}
          </h2>
        )}
        {content.content && (
          <MarkdownContent content={content.content} />
        )}
      </div>
    </section>
  );
};

const ContactBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.email && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <Mail className="size-5 text-primary" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Email</p>
              <a href={`mailto:${content.email}`} className="text-primary hover:underline">
                {content.email}
              </a>
            </div>
          </div>
        )}
        {content.phone && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <Phone className="size-5 text-primary" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Phone</p>
              <a href={`tel:${content.phone}`} className="text-primary hover:underline">
                {content.phone}
              </a>
            </div>
          </div>
        )}
        {content.address && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <MapPin className="size-5 text-primary" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Address</p>
              <p className="text-gray-600 dark:text-gray-400">{content.address}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const AnnouncementsBlockRenderer = ({ block, locale, announcements = [] }: { 
  block: ContentBlockWithTranslations; 
  locale: string;
  announcements?: any[];
}) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  let content = { title: "Latest Announcements", viewAllText: "View All" };
  if (translation?.content) {
    try {
      content = { ...content, ...JSON.parse(translation.content) };
    } catch {
      // Use defaults
    }
  }

  const config = block.configuration ? JSON.parse(block.configuration) : {};
  const limit = config.limit || 3;
  const displayAnnouncements = announcements.slice(0, limit);

  if (displayAnnouncements.length === 0) {
    return null;
  }

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6">
      <AnnouncementsSection 
        announcements={displayAnnouncements} 
        totalCount={announcements.length}
      />
    </section>
  );
};

const FeaturesBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  const features = content.features || [];
  
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'eye': return Eye;
      case 'message-square': return MessageSquare;
      case 'trending-up': return TrendingUp;
      default: return Info;
    }
  };

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {features.map((feature: any, idx: number) => {
          const IconComponent = getFeatureIcon(feature.icon);
          const colors = [
            { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
            { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
            { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" }
          ];
          const color = colors[idx % colors.length];
          
          return (
            <div 
              key={idx} 
              className="flex flex-col items-center text-center p-6 lg:p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark hover:shadow-xl transition-all hover:-translate-y-2 hover:border-primary/30 dark:hover:border-primary/30"
            >
              <div className={`p-5 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform ${color.bg}`}>
                <IconComponent className={`size-9 ${color.text}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const StatisticsBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  const stats = content.stats || [];
  
  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'file-text': return FileText;
      case 'check-circle-2': return CheckCircle2;
      case 'users': return Users;
      default: return BarChart3;
    }
  };

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6 md:py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <div className="px-6 md:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
            {content.title}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {content.subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat: any, idx: number) => {
            const IconComponent = getStatIcon(stat.icon);
            const colors = [
              { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
              { text: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
              { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" }
            ];
            const color = colors[idx % colors.length];
            
            return (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`mb-6 p-5 rounded-2xl ${color.bg} shadow-lg group-hover:scale-110 transition-transform ${color.text}`}>
                  <IconComponent className="size-10" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const CtaBlockRenderer = ({ block, locale }: { block: ContentBlockWithTranslations; locale: string }) => {
  const translation = block.translations.find(t => t.locale === locale) || 
                     block.translations.find(t => t.locale === 'en');
  
  if (!translation?.content) return null;
  
  let content;
  try {
    content = JSON.parse(translation.content);
  } catch {
    return null;
  }

  return (
    <section className="w-full px-6 md:px-8 lg:px-12 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/90 p-8 md:p-12 lg:p-16 text-center shadow-2xl">
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.033em] text-white">
            {content.title}
          </h2>
          {content.description && (
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {content.description}
            </p>
          )}
          {content.buttonText && content.buttonUrl && (
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              <Button asChild variant="outline" className="!bg-white !text-primary !border-0 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-xl hover:shadow-2xl">
                <Link href={content.buttonUrl} className="flex items-center gap-2">
                  {content.buttonText}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Main renderer component
export default function DynamicPageRenderer({ 
  pageTitle, 
  pageDescription, 
  blocks, 
  locale,
  appName,
  announcements = []
}: DynamicPageRendererProps) {
  const [sortedBlocks, setSortedBlocks] = useState<ContentBlockWithTranslations[]>([]);

  useEffect(() => {
    // Sort blocks by display order and filter visible ones
    const visibleBlocks = blocks
      .filter(block => block.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    setSortedBlocks(visibleBlocks);
  }, [blocks]);

  const renderBlock = (block: ContentBlockWithTranslations) => {
    const blockType = getBlockType(block.blockType);
    if (!blockType) return null;

    switch (block.blockType) {
      case 'hero':
        return <HeroBlockRenderer key={block.id} block={block} locale={locale} />;
      case 'text':
        return <TextBlockRenderer key={block.id} block={block} locale={locale} />;
      case 'cta':
        return <CtaBlockRenderer key={block.id} block={block} locale={locale} />;
      case 'contact':
        return <ContactBlockRenderer key={block.id} block={block} locale={locale} />;
      case 'announcements':
        return <AnnouncementsBlockRenderer key={block.id} block={block} locale={locale} announcements={announcements} />;
      case 'features':
        return <FeaturesBlockRenderer key={block.id} block={block} locale={locale} />;
      case 'statistics':
        return <StatisticsBlockRenderer key={block.id} block={block} locale={locale} />;
      default:
        return null;
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeaderClient appName={appName} />
      
      <main className="flex flex-col">
        {sortedBlocks.map(renderBlock)}
      </main>

      {/* Footer - only show for landing page */}
      {sortedBlocks.some(block => {
        const config = block.configuration ? JSON.parse(block.configuration) : {};
        return config.pageType === 'landing';
      }) && (
        <footer className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 mt-8">
          <div className="w-full px-6 md:px-8 lg:px-12 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <Link href="/" className="flex items-center gap-3 mb-4 text-gray-900 dark:text-white">
                  <div className="size-8 text-primary">
                    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
                      <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
                    </svg>
                  </div>
                  <span className="text-xl font-bold">{appName}</span>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  {locale === 'ms' 
                    ? 'Menghubungkan komuniti dan memperkasakan tadbir urus tempatan melalui teknologi untuk N.18 Inanam.'
                    : 'Connecting communities and empowering local governance through technology for N.18 Inanam.'
                  }
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  {locale === 'ms' ? 'Pautan Pantas' : 'Quick Links'}
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/how-it-works" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Bagaimana Ia Berfungsi' : 'How It Works'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/view-reports" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Lihat Laporan' : 'View Reports'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Tentang Kami' : 'About Us'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Hubungi Kami' : 'Contact Us'}
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  {locale === 'ms' ? 'Mulakan' : 'Get Started'}
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/report-issue" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Laporkan Isu' : 'Report Issue'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/community/login" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Log Masuk' : 'Login'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/community/register" className="hover:text-primary transition-colors">
                      {locale === 'ms' ? 'Daftar' : 'Register'}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'ms' 
                  ? `© ${new Date().getFullYear()} ${appName}. Hak cipta terpelihara.`
                  : `© ${new Date().getFullYear()} ${appName}. All rights reserved.`
                }
              </p>
              <div className="flex gap-6">
                <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
                  {locale === 'ms' ? 'Dasar Privasi' : 'Privacy Policy'}
                </Link>
                <Link href="/terms-of-service" className="text-sm hover:text-primary transition-colors">
                  {locale === 'ms' ? 'Terma Perkhidmatan' : 'Terms of Service'}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}