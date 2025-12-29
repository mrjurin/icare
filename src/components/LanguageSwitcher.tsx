"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { useTransition, useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLoadingOverlay } from '@/hooks/useLoadingOverlay';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoadingOverlay();
  const t = useTranslations('common');

  // Hide loading when transition completes
  useEffect(() => {
    if (!isPending) {
      // Transition completed, hide loading after a short delay
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isPending, setLoading]);

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    
    setLoading(true, t('switchingLanguage'));
    
    startTransition(() => {
      const browserPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
      const segments = browserPath.split('/').filter(segment => 
        segment && segment !== 'en' && segment !== 'ms'
      );
      const cleanPath = segments.length > 0 ? '/' + segments.join('/') : '/';
      const newPath = cleanPath === '/' ? `/${newLocale}` : `/${newLocale}${cleanPath}`;
      
      router.replace(newPath);
      setIsOpen(false);
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative group" ref={dropdownRef}>
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 text-sm"
        disabled={isPending}
        aria-label="Switch language"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="size-4" />
        <span>{locale === 'en' ? 'EN' : 'MS'}</span>
      </Button>
      <div className={`absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all z-50 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
      }`}>
        <button
          onClick={() => switchLocale('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-700 first:rounded-t-lg transition-colors ${
            locale === 'en' ? 'bg-primary/10 text-primary font-medium' : ''
          }`}
        >
          English
        </button>
        <button
          onClick={() => switchLocale('ms')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-700 last:rounded-b-lg transition-colors ${
            locale === 'ms' ? 'bg-primary/10 text-primary font-medium' : ''
          }`}
        >
          Bahasa Malaysia
        </button>
      </div>
    </div>
  );
}
