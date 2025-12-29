"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicHeaderClient from "@/components/PublicHeaderClient";
import MarkdownContent from "@/components/MarkdownContent";
import { 
  FileText, 
  Shield, 
  HelpCircle, 
  Info, 
  ArrowRight, 
  Users,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { getBlockType } from "@/lib/types/page-builder";

interface DynamicPageRendererProps {
  pageTitle: string;
  pageDescription?: string;
  blocks: ContentBlockWithTranslations[];
  locale: string;
  appName: string;
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
  const colors = getPageColors(pageType);
  const IconComponent = getPageIcon(pageType);

  return (
    <section className="w-full py-12 md:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
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
    <section className="w-full max-w-4xl px-4 md:px-0 py-10 md:py-20">
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
    <section className="w-full max-w-4xl px-4 md:px-0 py-8">
      <div className="flex flex-wrap gap-4">
        {content.primaryButton && (
          <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
            <Link href={content.primaryButton.link} className="flex items-center gap-2">
              {content.primaryButton.text}
              {content.primaryButton.showArrow && <ArrowRight className="size-5" />}
            </Link>
          </Button>
        )}
        {content.secondaryButton && (
          <Button asChild variant="outline" className="rounded-lg h-12 px-5">
            <Link href={content.secondaryButton.link}>
              {content.secondaryButton.text}
            </Link>
          </Button>
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
    <section className="w-full max-w-4xl px-4 md:px-0 py-10">
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

// Main renderer component
export default function DynamicPageRenderer({ 
  pageTitle, 
  pageDescription, 
  blocks, 
  locale,
  appName
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
      default:
        return null;
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeaderClient appName={appName} />
      
      <main className="flex flex-col items-center">
        {sortedBlocks.map(renderBlock)}
      </main>
    </div>
  );
}