"use client";

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter(); // Use Next.js native router
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return; // Don't switch if already on this locale
    
    startTransition(() => {
      // Get the actual browser pathname to handle any locale segments
      const browserPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
      
      // Split path into segments and filter out all locale segments (en, ms)
      const segments = browserPath.split('/').filter(segment => 
        segment && segment !== 'en' && segment !== 'ms'
      );
      
      // Reconstruct the path without locale segments
      const cleanPath = segments.length > 0 ? '/' + segments.join('/') : '/';
      
      // Construct the new path with the new locale (using native router, so we need full path)
      const newPath = cleanPath === '/' ? `/${newLocale}` : `/${newLocale}${cleanPath}`;
      
      router.replace(newPath);
    });
  };

  return (
    <div className="relative group">
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 text-sm"
        disabled={isPending}
        aria-label="Switch language"
      >
        <Globe className="size-4" />
        <span>{locale === 'en' ? 'EN' : 'MS'}</span>
      </Button>
      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => switchLocale('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg transition-colors ${
            locale === 'en' ? 'bg-primary/10 text-primary font-medium' : ''
          }`}
        >
          English
        </button>
        <button
          onClick={() => switchLocale('ms')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg transition-colors ${
            locale === 'ms' ? 'bg-primary/10 text-primary font-medium' : ''
          }`}
        >
          Bahasa Malaysia
        </button>
      </div>
    </div>
  );
}
