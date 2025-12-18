"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from '@/i18n/routing';
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock, CheckCircle2, User, CreditCard, MapPin, Building2, ArrowLeft, Home } from "lucide-react";
import { registerCommunityUser } from "@/lib/actions/auth";
import { getZonesPublic } from "@/lib/actions/zones";
import { getVillagesPublic } from "@/lib/actions/villages";
import { getDunName } from "@/lib/actions/settings";
import type { Zone } from "@/lib/actions/zones";
import type { Village } from "@/lib/actions/villages";

export default function CommunityRegisterPage() {
  const t = useTranslations("communityRegister");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [zoneId, setZoneId] = useState<number>(0);
  const [villageId, setVillageId] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [icNumberError, setIcNumberError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [villageError, setVillageError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkedToHousehold, setLinkedToHousehold] = useState(false);
  const [dunName, setDunName] = useState<string>("N.18 Inanam");

  // Data for dropdowns
  const [zones, setZones] = useState<Zone[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load DUN name
  useEffect(() => {
    const loadDunName = async () => {
      try {
        const result = await getDunName();
        if (result) {
          setDunName(result);
        }
      } catch (err) {
        console.error("Failed to load DUN name:", err);
      }
    };
    loadDunName();
  }, []);

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      setLoadingZones(true);
      const result = await getZonesPublic();
      if (result.success && result.data) {
        setZones(result.data);
      }
      setLoadingZones(false);
    };
    fetchZones();
  }, []);

  // Fetch villages when zone changes
  useEffect(() => {
    const fetchVillages = async () => {
      if (zoneId && zoneId > 0) {
        setLoadingVillages(true);
        setVillageId(0); // Reset village selection
        const result = await getVillagesPublic(zoneId);
        if (result.success && result.data) {
          setVillages(result.data);
        } else {
          setVillages([]);
        }
        setLoadingVillages(false);
      } else {
        setVillages([]);
        setVillageId(0);
      }
    };
    fetchVillages();
  }, [zoneId]);

  // Validate full name on blur
  const validateFullName = (value: string) => {
    if (!value.trim()) {
      setFullNameError(t("validation.fullNameRequired"));
      return false;
    }
    if (value.trim().length < 2) {
      setFullNameError(t("validation.fullNameMinLength"));
      return false;
    }
    setFullNameError(null);
    return true;
  };

  // Validate email on blur
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError(t("validation.emailRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setEmailError(t("validation.emailInvalid"));
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate IC number on blur
  const validateIcNumber = (value: string) => {
    if (!value.trim()) {
      setIcNumberError(t("validation.icNumberRequired"));
      return false;
    }
    // Remove dashes and spaces for validation
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 12) {
      setIcNumberError(t("validation.icNumberInvalid"));
      return false;
    }
    setIcNumberError(null);
    return true;
  };

  // Validate password on blur
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError(t("validation.passwordRequired"));
      return false;
    }
    if (value.length < 6) {
      setPasswordError(t("validation.passwordMinLength"));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // Validate confirm password on blur
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError(t("validation.confirmPasswordRequired"));
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError(t("validation.passwordsDoNotMatch"));
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFullNameError(null);
    setEmailError(null);
    setIcNumberError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setZoneError(null);
    setVillageError(null);

    // Validate all inputs
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isIcNumberValid = validateIcNumber(icNumber);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!zoneId || zoneId === 0) {
      setZoneError(t("validation.zoneRequired"));
    }
    if (!villageId || villageId === 0) {
      setVillageError(t("validation.villageRequired"));
    }

    if (!isFullNameValid || !isEmailValid || !isIcNumberValid || !isPasswordValid || !isConfirmPasswordValid || !zoneId || !villageId) {
      return;
    }

    if (!termsAccepted) {
      setError(t("validation.termsRequired"));
      return;
    }

    setLoading(true);

    try {
      const result = await registerCommunityUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        icNumber: icNumber.trim(),
        villageId,
        zoneId,
      });

      if (!result.success) {
        setError(result.error || t("errors.generic"));
        setLoading(false);
        return;
      }

      // Check if user was linked to household
      if (result.data?.linkedToHousehold) {
        setLinkedToHousehold(true);
      }

      setSuccess(true);
      // Small delay to show success state
      setTimeout(() => {
        router.push("/community/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unexpected"));
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
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmv2CVtuNASMwZdMSvemNUs8M8rpPOUmfvweQGpyAeoi8ItTn569RZolM1Y1n9js1J7O4y7UbaCdnWdtS8rJyU_7SVoXf6f3yNc8Eg88c10upP-BjUC0TthPe2m3a-7wXiV_uUg5V7pUxTVdwYe_wnXOsdB15QYP6J-SMJLVepYX-j2kYCLoc-ilIv6uTqKe47siL52mxK_jOr1qnfC7Jd2fAsGRpWw0tqo1Uu4VlM4LygeNDgS0gKAyfJHsoFwiyMaH2Aj48qBc0")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h2 className="text-2xl font-bold mb-2">{t("hero.title")}</h2>
                <p className="text-sm text-gray-200">{t("hero.description", { dunName })}</p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16">
            {/* Back to Login Selection and Home */}
            <div className="mb-4 flex items-center gap-3">
              <I18nLink 
                href="/community/login" 
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
              >
                <ArrowLeft className="size-4" />
                {t("backToLogin")}
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
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out opacity-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">{t("success.title")}</p>
                  </div>
                  {linkedToHousehold && (
                    <p className="text-xs text-green-700 dark:text-green-300 ml-8">
                      {t("success.linkedToHousehold")}
                    </p>
                  )}
                  <p className="text-xs text-green-700 dark:text-green-300 ml-8">{t("success.redirecting")}</p>
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
                {/* Full Name Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.fullName")}</span>
                  </div>
                  <Input
                    type="text"
                    placeholder={t("fields.fullNamePlaceholder")}
                    className={`h-14 transition-all duration-200 ${
                      fullNameError ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900" : ""
                    }`}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) setFullNameError(null);
                      if (error) setError(null);
                    }}
                    onBlur={() => validateFullName(fullName)}
                    disabled={loading || success}
                    required
                    autoComplete="name"
                  />
                  {fullNameError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {fullNameError}
                    </p>
                  )}
                </label>

                {/* Email Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.emailAddress")}</span>
                  </div>
                  <Input
                    type="email"
                    placeholder={t("fields.emailPlaceholder")}
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

                {/* IC Number Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.icNumber")}</span>
                  </div>
                  <Input
                    type="text"
                    placeholder={t("fields.icNumberPlaceholder")}
                    className={`h-14 transition-all duration-200 ${
                      icNumberError ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900" : ""
                    }`}
                    value={icNumber}
                    onChange={(e) => {
                      setIcNumber(e.target.value);
                      if (icNumberError) setIcNumberError(null);
                      if (error) setError(null);
                    }}
                    onBlur={() => validateIcNumber(icNumber)}
                    disabled={loading || success}
                    required
                    autoComplete="off"
                  />
                  {icNumberError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {icNumberError}
                    </p>
                  )}
                </label>

                {/* Zone Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.zone")}</span>
                  </div>
                  <select
                    value={zoneId}
                    onChange={(e) => {
                      setZoneId(parseInt(e.target.value, 10));
                      setVillageId(0);
                      if (zoneError) setZoneError(null);
                      if (error) setError(null);
                    }}
                    disabled={loading || success || loadingZones}
                    required
                    className={`h-14 px-4 text-sm rounded-lg border transition-all duration-200 ${
                      zoneError
                        ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900"
                        : "border-[#dbe0e6] dark:border-gray-700 focus:border-primary focus:ring-primary/20"
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  >
                    <option value={0}>{t("fields.zonePlaceholder")}</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  {zoneError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {zoneError}
                    </p>
                  )}
                </label>

                {/* Village Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.village")}</span>
                  </div>
                  <select
                    value={villageId}
                    onChange={(e) => {
                      setVillageId(parseInt(e.target.value, 10));
                      if (villageError) setVillageError(null);
                      if (error) setError(null);
                    }}
                    disabled={loading || success || loadingVillages || !zoneId || zoneId === 0}
                    required
                    className={`h-14 px-4 text-sm rounded-lg border transition-all duration-200 ${
                      villageError
                        ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900"
                        : "border-[#dbe0e6] dark:border-gray-700 focus:border-primary focus:ring-primary/20"
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value={0}>
                      {loadingVillages ? t("fields.villageLoading") : !zoneId || zoneId === 0 ? t("fields.villageSelectZoneFirst") : t("fields.villagePlaceholder")}
                    </option>
                    {villages.map((village) => (
                      <option key={village.id} value={village.id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                  {villageError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {villageError}
                    </p>
                  )}
                </label>

                {/* Password Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.password")}</span>
                  </div>
                  <PasswordField
                    password={password}
                    setPassword={setPassword}
                    disabled={loading || success}
                    error={passwordError}
                    placeholder={t("fields.passwordPlaceholder")}
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

                {/* Confirm Password Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">{t("fields.confirmPassword")}</span>
                  </div>
                  <PasswordField
                    password={confirmPassword}
                    setPassword={setConfirmPassword}
                    disabled={loading || success}
                    error={confirmPasswordError}
                    placeholder={t("fields.confirmPasswordPlaceholder")}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    onFocus={() => {
                      if (confirmPasswordError) setConfirmPasswordError(null);
                      if (error) setError(null);
                    }}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {confirmPasswordError}
                    </p>
                  )}
                </label>

                {/* Terms and Conditions */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (error) setError(null);
                    }}
                    disabled={loading || success}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all mt-0.5"
                  />
                  <span className="text-sm text-[#617589] dark:text-gray-400 group-hover:text-[#111418] dark:group-hover:text-gray-300 transition-colors">
                    {t("terms.accept")}{" "}
                    <I18nLink
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      {t("terms.termsOfService")}
                    </I18nLink>{" "}
                    {t("terms.and")}{" "}
                    <I18nLink
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      {t("terms.privacyPolicy")}
                    </I18nLink>
                    .
                  </span>
                </label>
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
                      <span>{t("submit.creating")}</span>
                    </span>
                  ) : success ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-5" />
                      <span>{t("submit.success")}</span>
                    </span>
                  ) : (
                    t("submit.button")
                  )}
                </Button>
                <p className="text-[#617589] dark:text-gray-400 text-center text-sm">
                  {t("loginLink.alreadyHaveAccount")}{" "}
                  <a
                    className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                    href="/community/login"
                  >
                    {t("loginLink.loginHere")}
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
  placeholder = "Enter your password",
  onBlur,
  onFocus,
}: {
  password: string;
  setPassword: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  placeholder?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}) {
  const t = useTranslations("communityRegister");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex w-full items-stretch">
      <div className="flex-1 relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
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
          autoComplete="new-password"
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow((s) => !s);
        }}
        aria-label={show ? t("passwordToggle.hide") : t("passwordToggle.show")}
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
