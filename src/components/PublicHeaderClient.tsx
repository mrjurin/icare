"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Button from "@/components/ui/Button";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { getCurrentUserProfile, type ProfileData } from "@/lib/actions/profile";

interface PublicHeaderClientProps {
  appName: string;
}

export default function PublicHeaderClient({ appName }: PublicHeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string | null; avatarUrl: string | null } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'community' | null>(null);
  const [loading, setLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations('nav');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Get profile data
          const profileData = await getCurrentUserProfile();
          setProfile(profileData);
          
          setUser({
            email: authUser.email || null,
            avatarUrl: authUser.user_metadata?.avatar_url || profileData?.avatarUrl || null,
          });

          // Check if user is staff/admin
          const userEmail = authUser.email?.toLowerCase().trim();
          if (userEmail) {
            // Check staff table
            let { data: staff } = await supabase
              .from("staff")
              .select("id, role, status, email, ic_number")
              .eq("email", userEmail)
              .eq("status", "active")
              .maybeSingle();

            // If not found by email, check if it's a generated email from IC number
            if (!staff && userEmail.endsWith("@staff.local")) {
              const icNumber = userEmail.replace("@staff.local", "").replace(/[-\s]/g, "");
              const { data: staffByIc } = await supabase
                .from("staff")
                .select("id, role, status, email, ic_number")
                .eq("ic_number", icNumber)
                .eq("status", "active")
                .maybeSingle();
              
              if (staffByIc) {
                staff = staffByIc;
              }
            }

            if (staff) {
              // User is a staff member
              const adminRoles = ["super_admin", "adun", "zone_leader", "staff_manager"];
              if (adminRoles.includes(staff.role)) {
                setUserRole('admin');
              } else {
                setUserRole('staff');
              }
            } else {
              // Check if user is a community user
              const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", userEmail)
                .maybeSingle();

              if (profile) {
                setUserRole('community');
              } else {
                setUserRole(null);
              }
            }
          }
        } else {
          setUser(null);
          setProfile(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
        setProfile(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setUserMenuOpen(false);
    router.push("/community/login");
    router.refresh();
  };

  const rawDisplayName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const displayName = rawDisplayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;

  // Determine dashboard URL based on user role
  // The Link component from '@/i18n/routing' automatically handles locale
  const getDashboardUrl = () => {
    if (userRole === 'admin') {
      return '/admin/dashboard';
    } else if (userRole === 'staff') {
      return '/staff/dashboard';
    } else if (userRole === 'community') {
      return '/community/dashboard';
    }
    return '/community/dashboard'; // Default fallback
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 md:px-10 py-4 bg-white dark:bg-background-dark sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-3 text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
              <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-[-0.015em]">{appName}</h2>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            <Link href="/how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              {t('howItWorks')}
            </Link>
            <Link href="/view-reports" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              {t('viewReports')}
            </Link>
            <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              {t('about')}
            </Link>
            <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              {t('contact')}
            </Link>
          </nav>
          <div className="flex gap-3 items-center">
            <LanguageSwitcher />
            <Button asChild className="rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
              <Link href="/report-issue">{t('reportIssue')}</Link>
            </Button>
            {!loading && (
              user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="size-4 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                      {displayName}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        {user.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        )}
                      </div>
                      <Link
                        href="/community/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="size-4" />
                        Profile
                      </Link>
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild variant="outline" className="h-10 px-5">
                  <Link href="/login">{t('loginRegister')}</Link>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-700 dark:text-gray-300"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 z-40">
          <nav className="flex flex-col p-6 gap-4">
            <Link 
              href="/how-it-works" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('howItWorks')}
            </Link>
            <Link 
              href="/view-reports" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('viewReports')}
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('about')}
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('contact')}
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <Button asChild className="w-full rounded-lg h-12 bg-primary text-white font-bold">
                <Link href="/report-issue" onClick={() => setMobileMenuOpen(false)}>{t('reportIssue')}</Link>
              </Button>
              {!loading && (
                user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="size-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                        {user.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/community/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium"
                    >
                      Profile
                    </Link>
                    <Link
                      href={getDashboardUrl()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="px-4 py-2 text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Button asChild variant="outline" className="w-full h-12">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>{t('loginRegister')}</Link>
                  </Button>
                )
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
