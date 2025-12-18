"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Link as I18nLink } from '@/i18n/routing';
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock, CheckCircle2, ArrowLeft, Home } from "lucide-react";
import { getSetting, getDunName } from "@/lib/actions/settings";

export default function CommunityLoginPage() {
  const t = useTranslations("communityLogin");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null);
  const [dunName, setDunName] = useState<string>("N.18 Inanam");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load login image setting and DUN name
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [imageResult, dunNameResult] = await Promise.all([
          getSetting("community_login_image_url"),
          getDunName(),
        ]);
        if (imageResult.success && imageResult.data) {
          setLoginImageUrl(imageResult.data);
        }
        if (dunNameResult) {
          setDunName(dunNameResult);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, []);

  // Validate email on blur
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError(t("emailRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setEmailError(t("emailInvalid"));
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate password on blur
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError(t("passwordRequired"));
      return false;
    }
    if (value.length < 6) {
      setPasswordError(t("passwordMinLength"));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      // Attempt to sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        // Provide user-friendly error messages
        if (signInError.message.includes("Invalid login credentials")) {
          setError(t("errors.invalidCredentials"));
        } else if (signInError.message.includes("Email not confirmed")) {
          setError(t("errors.emailNotConfirmed"));
        } else {
          setError(signInError.message || t("errors.genericError"));
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Small delay to show success state
        setTimeout(() => {
          router.push("/community/dashboard");
          router.refresh();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unexpectedError"));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="flex w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 transition-all duration-300 hover:shadow-3xl">
          {/* Left side - Image */}
          <div className="hidden w-1/2 lg:flex relative">
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat relative"
              style={{
                backgroundImage: loginImageUrl
                  ? `url("${loginImageUrl}")`
                  : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmv2CVtuNASMwZdMSvemNUs8M8rpPOUmfvweQGpyAeoi8ItTn569RZolM1Y1n9js1J7O4y7UbaCdnWdtS8rJyU_7SVoXf6f3yNc8Eg88c10upP-BjUC0TthPe2m3a-7wXiV_uUg5V7pUxTVdwYe_wnXOsdB15QYP6J-SMJLVepYX-j2kYCLoc-ilIv6uTqKe47siL52mxK_jOr1qnfC7Jd2fAsGRpWw0tqo1Uu4VlM4LygeNDgS0gKAyfJHsoFwiyMaH2Aj48qBc0")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h2 className="text-2xl font-bold mb-2">{t("welcomeBack")}</h2>
                <p className="text-sm text-gray-200">{t("welcomeDescription", { dunName })}</p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16">
            {/* Back to Login Selection and Home */}
            <div className="mb-4 flex items-center gap-3">
              <I18nLink 
                href="/login" 
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
              >
                <ArrowLeft className="size-4" />
                {t("backToLoginSelection")}
              </I18nLink>
              <I18nLink 
                href="/" 
                className="inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Go to Home"
              >
                <Home className="size-4" />
              </I18nLink>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <h1 className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  {t("title")}
                </h1>
                <p className="text-[#617589] dark:text-gray-400 text-base">
                  {t("subtitle", { dunName })}
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">{t("loginSuccessful")}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="flex flex-col gap-5">
                {/* Email Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("emailAddress")}</span>
                  </div>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className={`h-14 transition-all duration-200 ${
                      emailError ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900" : ""
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                      if (error) setError(null);
                    }}
                    onBlur={() => validateEmail(email)}
                    disabled={loading || success}
                    required
                    autoComplete="email"
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {emailError}
                    </p>
                  )}
                </label>

                {/* Password Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("password")}</span>
                  </div>
                  <PasswordField
                    password={password}
                    setPassword={setPassword}
                    disabled={loading || success}
                    error={passwordError}
                    onBlur={() => validatePassword(password)}
                    onFocus={() => {
                      if (passwordError) setPasswordError(null);
                      if (error) setError(null);
                    }}
                  />
                  {passwordError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {passwordError}
                    </p>
                  )}
                </label>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading || success}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all"
                    />
                    <span className="text-sm text-[#617589] dark:text-gray-400 group-hover:text-[#111418] dark:group-hover:text-gray-300 transition-colors">
                      {t("rememberMe")}
                    </span>
                  </label>
                  <Link
                    href="/community/forgot-password"
                    className="text-primary text-sm font-medium hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="h-14 w-full relative transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={loading || success}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      <span>Logging in...</span>
                    </span>
                  ) : success ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-5" />
                      <span>Success!</span>
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <p className="text-[#617589] dark:text-gray-400 text-center text-sm">
                  {t("dontHaveAccount")}{" "}
                  <a
                    className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                    href="/community/register"
                  >
                    {t("registerHere")}
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  password,
  setPassword,
  disabled,
  error,
  onBlur,
  onFocus,
}: {
  password: string;
  setPassword: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  onBlur?: () => void;
  onFocus?: () => void;
}) {
  const t = useTranslations("communityLogin");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex w-full items-stretch">
      <div className="flex-1 relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={t("passwordPlaceholder")}
          className={`h-14 w-full rounded-r-none border-r-0 transition-all duration-200 ${
            error ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900" : ""
          } ${focused ? "ring-2 ring-primary/20" : ""}`}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          disabled={disabled}
          required
          autoComplete="current-password"
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow((s) => !s);
        }}
        aria-label={show ? t("hidePassword") : t("showPassword")}
        disabled={disabled}
        className={`flex-shrink-0 h-14 flex items-center justify-center px-4 rounded-r-lg border border-l-0 text-[#617589] dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-red-300 dark:border-red-700" : "border-[#dbe0e6] dark:border-gray-700"
        }`}
        tabIndex={-1}
      >
        {show ? (
          <EyeOff className="size-5 transition-transform duration-200" />
        ) : (
          <Eye className="size-5 transition-transform duration-200" />
        )}
      </button>
    </div>
  );
}
