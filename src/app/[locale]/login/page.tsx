"use client";

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Button from "@/components/ui/Button";
import { User, Users, Shield, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginSelectionPage() {
  const t = useTranslations('loginSelection');
  
  const loginOptions = [
    {
      id: 'staff',
      icon: User,
      title: t('staff.title'),
      description: t('staff.description'),
      href: '/staff/login',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverColor: 'hover:border-blue-400 dark:hover:border-blue-600'
    },
    {
      id: 'community',
      icon: Users,
      title: t('community.title'),
      description: t('community.description'),
      href: '/community/login',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:border-green-400 dark:hover:border-green-600'
    },
    {
      id: 'admin',
      icon: Shield,
      title: t('admin.title'),
      description: t('admin.description'),
      href: '/admin/login',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      hoverColor: 'hover:border-purple-400 dark:hover:border-purple-600'
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl">
          {/* Back to Home Link */}
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
            >
              <ArrowLeft className="size-4" />
              {t('backToHome')}
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Login Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {loginOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className={`group relative flex flex-col gap-4 rounded-2xl border-2 ${option.borderColor} ${option.hoverColor} bg-white dark:bg-background-dark p-6 lg:p-8 hover:shadow-xl transition-all hover:-translate-y-2`}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`flex items-center justify-center size-16 rounded-xl ${option.color} flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="size-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {option.description}
                      </p>
                    </div>
                    <Button
                      asChild
                      className={`w-full h-12 font-bold transition-all hover:scale-105 ${
                        option.id === 'staff'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : option.id === 'community'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <Link href={option.href} className="flex items-center justify-center gap-2">
                        {t('loginButton')}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
