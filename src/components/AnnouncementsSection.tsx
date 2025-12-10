"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Announcement } from '@/lib/actions/announcements';
import { Megaphone, Calendar, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  totalCount?: number; // Total count of active announcements
}

export default function AnnouncementsSection({ announcements, totalCount }: AnnouncementsSectionProps) {
  const t = useTranslations('home.announcements');
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  if (announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.has(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const displayAnnouncements = showAll ? visibleAnnouncements : visibleAnnouncements.slice(0, 3);
  const hasMore = visibleAnnouncements.length > 3;
  const showViewAll = totalCount && totalCount > visibleAnnouncements.length;

  return (
    <section className="py-8 md:py-12">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20">
              <Megaphone className="size-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white">
              {t('title')}
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {displayAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
            >
              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Dismiss announcement"
              >
                <X className="size-4" />
              </button>

              {/* Category badge */}
              {announcement.category && announcement.category !== 'general' && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                    {announcement.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 pr-8">
                {announcement.title}
              </h3>

              {/* Content */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1 leading-relaxed">
                {announcement.content}
              </p>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Calendar className="size-4" />
                <span>{formatDate(announcement.published_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Show More / View All Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {hasMore && (
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="rounded-xl h-11 px-6 font-semibold"
            >
              {showAll ? (
                <>
                  <ChevronUp className="size-4 mr-2" />
                  {t('showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="size-4 mr-2" />
                  {t('showMore', { count: visibleAnnouncements.length - 3 })}
                </>
              )}
            </Button>
          )}
          
          {showViewAll && (
            <Button asChild className="rounded-xl h-11 px-6 bg-primary text-white font-semibold hover:bg-primary/90">
              <Link href="/announcements" className="flex items-center gap-2">
                {t('viewAll')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
