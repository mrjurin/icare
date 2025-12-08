"use client";

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Button from "@/components/ui/Button";
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  MessageSquare, 
  MapPin, 
  Eye,
  ArrowRight,
  Shield,
  Clock,
  BarChart3
} from "lucide-react";
import PublicHeaderClient from "@/components/PublicHeaderClient";

interface HomeClientProps {
  appName: string;
}

export default function HomeClient({ appName }: HomeClientProps) {
  const t = useTranslations('home');
  
  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <PublicHeaderClient appName={appName} />

        <main className="flex flex-col items-center">
          <div className="w-full max-w-6xl px-4 md:px-6 lg:px-0">
            {/* Hero Section */}
            <section className="py-12 md:py-20 lg:py-28">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 p-8 md:p-12 lg:p-16">
                <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">
                    {t('hero.title').replace(t('hero.titleHighlight'), '')} <span className="text-primary">{t('hero.titleHighlight')}</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    {t('hero.description')}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    <Button asChild className="rounded-lg h-12 md:h-14 px-6 md:px-8 bg-primary text-white text-base md:text-lg font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg">
                      <Link href="/report-issue" className="flex items-center gap-2">
                        {t('hero.reportIssue')}
                        <ArrowRight className="size-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-lg h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                      <Link href="/view-reports" className="flex items-center gap-2">
                        {t('hero.viewReports')}
                        <Eye className="size-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="py-12 md:py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
                  {t('howItWorks.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {t('howItWorks.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    step: "1",
                    icon: FileText,
                    title: t('howItWorks.step1.title'),
                    description: t('howItWorks.step1.description'),
                    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  },
                  {
                    step: "2",
                    icon: Users,
                    title: t('howItWorks.step2.title'),
                    description: t('howItWorks.step2.description'),
                    color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  },
                  {
                    step: "3",
                    icon: CheckCircle2,
                    title: t('howItWorks.step3.title'),
                    description: t('howItWorks.step3.description'),
                    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={i} 
                      className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 lg:p-8 hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center size-12 rounded-xl ${item.color} flex-shrink-0`}>
                          <Icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500">STEP {item.step}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Statistics Section */}
            <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-2xl">
              <div className="px-6 md:px-12">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
                    {t('statistics.title')}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {t('statistics.subtitle')}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                  {[
                    { value: "1,200+", label: t('statistics.issuesReported'), icon: FileText, color: "text-blue-600 dark:text-blue-400" },
                    { value: "950+", label: t('statistics.issuesResolved'), icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
                    { value: "3,500+", label: t('statistics.activeMembers'), icon: Users, color: "text-purple-600 dark:text-purple-400" }
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center group">
                        <div className={`mb-4 p-4 rounded-full bg-white dark:bg-gray-800 shadow-md group-hover:scale-110 transition-transform ${stat.color}`}>
                          <Icon className="size-8" />
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
                          {stat.value}
                        </p>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-12 md:py-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
                  {t('features.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {t('features.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    icon: Eye,
                    title: t('features.transparentTracking.title'),
                    description: t('features.transparentTracking.description'),
                    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  },
                  {
                    icon: MessageSquare,
                    title: t('features.directCommunication.title'),
                    description: t('features.directCommunication.description'),
                    color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  },
                  {
                    icon: TrendingUp,
                    title: t('features.collectiveProblemSolving.title'),
                    description: t('features.collectiveProblemSolving.description'),
                    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  }
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center text-center p-6 lg:p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className={`p-4 rounded-full mb-6 ${feature.color}`}>
                        <Icon className="size-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
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

            {/* CTA Section */}
            <section className="py-12 md:py-20">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/90 p-8 md:p-12 lg:p-16 text-center">
                <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.033em] text-white">
                    {t('cta.title')}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                    {t('cta.description')}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    <Button asChild variant="outline" className="!bg-white !text-primary !border-0 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold hover:!bg-gray-100 transition-all hover:scale-105 shadow-lg">
                      <Link href="/report-issue" className="flex items-center gap-2">
                        {t('cta.reportIssue')}
                        <ArrowRight className="size-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-lg h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold border-2 border-white text-white hover:bg-white/10 transition-all">
                      <Link href="/community/register" className="flex items-center gap-2">
                        {t('cta.createAccount')}
                        <Users className="size-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 mt-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0 py-12">
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
                  The official platform for residents to report local issues and drive community-led solutions in N.18 Inanam.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('footer.quickLinks')}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/how-it-works" className="hover:text-primary transition-colors">
                      {t('footer.howItWorks')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/view-reports" className="hover:text-primary transition-colors">
                      {t('footer.viewReports')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-primary transition-colors">
                      {t('footer.about')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-primary transition-colors">
                      {t('footer.contact')}
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('footer.getStarted')}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/report-issue" className="hover:text-primary transition-colors">
                      {t('footer.reportIssue')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/community/login" className="hover:text-primary transition-colors">
                      {t('footer.login')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/community/register" className="hover:text-primary transition-colors">
                      {t('footer.register')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('footer.allRightsReserved', { appName })}
              </p>
              <div className="flex gap-6">
                <Link href="/about" className="text-sm hover:text-primary transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
                <Link href="/contact" className="text-sm hover:text-primary transition-colors">
                  {t('footer.termsOfService')}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
