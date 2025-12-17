"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock, CheckCircle2, UserCheck } from "lucide-react";
import { getSetting, getDunName } from "@/lib/actions/settings";

export default function StaffLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState(""); // Can be email or IC number
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginIdError, setLoginIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null);
  const [dunName, setDunName] = useState<string>("N.18 Inanam");

  // Memoize supabase client to avoid recreating on every render
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Load login image setting and DUN name
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [imageResult, dunNameResult] = await Promise.all([
          getSetting("staff_login_image_url"),
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

  // Check if user is already logged in as staff
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Check if user is a staff member (by email or generated email from IC)
          let { data: staffData } = await supabase
            .from("staff")
            .select("id, status, email, ic_number")
            .eq("email", user.email.toLowerCase())
            .eq("status", "active")
            .maybeSingle();

          // If not found by email, check if it's a generated email from IC number
          if (!staffData && user.email.endsWith("@staff.local")) {
            const icNumber = user.email.replace("@staff.local", "").replace(/[-\s]/g, "");
            const { data: staffByIc } = await supabase
              .from("staff")
              .select("id, status, email, ic_number")
              .eq("ic_number", icNumber)
              .eq("status", "active")
              .maybeSingle();
            
            if (staffByIc) {
              staffData = staffByIc;
            }
          }

          const matchingStaff = staffData;

          if (matchingStaff) {
            // User is already logged in as staff, redirect to staff dashboard
            router.push("/staff/dashboard");
            return;
          }
        }
      } catch (err) {
        // Ignore errors, just continue to login form
        console.error("Auth check error:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Validate login ID (email or IC number) on blur
  const validateLoginId = (value: string) => {
    if (!value.trim()) {
      setLoginIdError("Email or IC number is required");
      return false;
    }
    // Check if it's an email or IC number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(value.trim());
    // IC number format: typically 12 digits (with or without dashes)
    const icRegex = /^[0-9]{6,12}(-[0-9]{2}-[0-9]{4})?$/;
    const isIc = icRegex.test(value.trim().replace(/\s/g, ""));
    
    if (!isEmail && !isIc) {
      setLoginIdError("Please enter a valid email address or IC number");
      return false;
    }
    setLoginIdError(null);
    return true;
  };

  // Validate password on blur
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoginIdError(null);
    setPasswordError(null);

    // Validate inputs
    const isLoginIdValid = validateLoginId(loginId);
    const isPasswordValid = validatePassword(password);

    if (!isLoginIdValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      // Determine if loginId is email or IC number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(loginId.trim());
      
      let staffData;
      let authEmail: string;

      if (isEmail) {
        // Find staff by email
        const { data, error: staffError } = await supabase
          .from("staff")
          .select("id, email, ic_number, role, status")
          .eq("email", loginId.trim().toLowerCase())
          .eq("status", "active")
          .single();

        if (staffError || !data) {
          setError("Invalid email or password. Please check your credentials and try again.");
          setLoading(false);
          return;
        }

        staffData = data;
        authEmail = data.email!.toLowerCase();
      } else {
        // Find staff by IC number
        const cleanIc = loginId.trim().replace(/[-\s]/g, "");
        const { data, error: staffError } = await supabase
          .from("staff")
          .select("id, email, ic_number, role, status")
          .eq("ic_number", cleanIc)
          .eq("status", "active")
          .single();

        if (staffError || !data) {
          setError("Invalid IC number or password. Please check your credentials and try again.");
          setLoading(false);
          return;
        }

        staffData = data;
        // Use the same logic as creation: prioritize email if available, otherwise use IC-based email
        if (data.email?.trim()) {
          authEmail = data.email.toLowerCase();
        } else {
          // Generate auth email from IC number
          authEmail = `${cleanIc}@staff.local`;
        }
      }

      // Attempt to sign in with Supabase using the auth email
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password,
      });

      if (signInError) {
        // Provide user-friendly error messages
        if (signInError.message.includes("Invalid login credentials") || signInError.message.includes("Invalid login")) {
          // Check if staff record exists but auth user doesn't
          if (staffData) {
            setError(
              "This account exists in the system but hasn't been set up in authentication. " +
              "Please contact your administrator to set up your login credentials. " +
              "The administrator needs to create your authentication account with the password they provided."
            );
          } else {
            setError(
              "Invalid password. Please check your credentials and try again. " +
              "If you believe this is an error, please contact your administrator."
            );
          }
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else {
          setError(signInError.message || "An error occurred. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Verify that the user is a staff member (double check)
        if (!staffData) {
          await supabase.auth.signOut();
          setError("Access denied. This account is not authorized for staff access. Please contact your administrator.");
          setLoading(false);
          return;
        }

        setSuccess(true);
        // Small delay to show success state, then use window.location for full page reload
        // This ensures cookies are properly set before server-side layout runs
        setTimeout(() => {
          window.location.href = "/staff/dashboard";
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="flex items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-lg text-gray-600 dark:text-gray-400">Checking authentication...</span>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="size-6" />
                  <h2 className="text-2xl font-bold">Staff Portal</h2>
                </div>
                <p className="text-sm text-gray-200">Access your assigned issues and zone management tools.</p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="size-6 text-primary" />
                  <h1 className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    Staff Login
                  </h1>
                </div>
                <p className="text-[#617589] dark:text-gray-400 text-base">
                  Sign in to access your staff dashboard for {dunName}.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">Login successful! Redirecting...</p>
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
                {/* Login ID Field (Email or IC Number) */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">Email or IC Number</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="staff@n18inanam.gov.my or 123456789012"
                    className={`h-14 transition-all duration-200 ${
                      loginIdError ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900" : ""
                    }`}
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      if (loginIdError) setLoginIdError(null);
                      if (error) setError(null);
                    }}
                    onBlur={() => validateLoginId(loginId)}
                    disabled={loading || success}
                    required
                    autoComplete="username"
                  />
                  {loginIdError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                      <AlertCircle className="size-3" />
                      {loginIdError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can login using your email address or IC number
                  </p>
                </label>

                {/* Password Field */}
                <label className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-[#617589] dark:text-gray-400" />
                    <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">Password</span>
                  </div>
                  <PasswordField
                    password={password}
                    setPassword={(value) => {
                      setPassword(value);
                      if (passwordError) setPasswordError(null);
                      if (error) setError(null);
                    }}
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
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-primary text-sm font-medium hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                  >
                    Forgot Password?
                  </a>
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
                  For admin login,{" "}
                  <a
                    className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                    href="/admin/login"
                  >
                    click here
                  </a>
                  {" "}or for community member login,{" "}
                  <a
                    className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                    href="/community/login"
                  >
                    click here
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
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex w-full items-stretch">
      <div className="flex-1 relative">
        <Input
          type={show ? "text" : "password"}
          placeholder="Enter your password"
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
        aria-label={show ? "Hide password" : "Show password"}
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
