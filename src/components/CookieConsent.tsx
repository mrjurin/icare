"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Button from "@/components/ui/Button";
import { Cookie, Shield, X } from "lucide-react";
import { getCookieConsent, setCookieConsent, hasCookieConsent } from "@/lib/utils/cookie-consent";

export default function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only show if consent hasn't been given
    if (!hasCookieConsent()) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  const handleAccept = () => {
    setCookieConsent("accepted");
    setIsOpen(false);
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Icon and Content */}
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Cookie className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="cookie-consent-title"
                className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"
              >
                <Shield className="size-5 text-blue-600 dark:text-blue-400" />
                {t("title")}
              </h3>
              <p
                id="cookie-consent-description"
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2"
              >
                {t("description")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {t("essentialCookies")}
              </p>
              <Link
                href="/privacy-policy"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
              >
                {t("privacyLink")}
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleReject}
              className="w-full sm:w-auto min-w-[120px]"
              aria-label={t("reject")}
            >
              {t("reject")}
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto min-w-[120px]"
              aria-label={t("accept")}
            >
              {t("accept")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
