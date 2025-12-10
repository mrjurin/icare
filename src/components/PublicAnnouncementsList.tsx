"use client";

import { useTranslations } from 'next-intl';
import { Announcement } from '@/lib/actions/announcements';
import { Calendar, Megaphone } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { usePathname } from '@/i18n/routing';

interface PublicAnnouncementsListProps {
  announcements: Announcement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
}

export default function PublicAnnouncementsList({ announcements, pagination }: PublicAnnouncementsListProps) {
  const t = useTranslations('announcements');
  const pathname = usePathname();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Megaphone className="size-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('noAnnouncements')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('noAnnouncementsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            {/* Category badge */}
            {announcement.category && announcement.category !== 'general' && (
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                  {announcement.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {announcement.title}
            </h3>

            {/* Content */}
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-4 flex-1 leading-relaxed">
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          baseUrl={pathname}
        />
      )}
    </div>
  );
}
