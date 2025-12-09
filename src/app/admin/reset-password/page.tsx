"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, Loader2, Lock, CheckCircle2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if we have a valid session (user clicked the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, the link might be invalid or expired
        // But we'll let the user try anyway - Supabase will handle validation
      }
    };
    checkSession();
  }, [supabase]);

  // Validate password
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

  // Validate confirm password
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Validate inputs
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "An error occurred. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/admin/login");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="flex w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 transition-all duration-300 hover:shadow-3xl">
          <div className="w-full flex flex-col justify-center p-8 sm:p-12 md:p-16">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Back to Login */}
              <Link
                href="/admin/login"
                className="flex items-center gap-2 text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-gray-300 transition-colors text-sm mb-2"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </Link>

              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-6 text-primary" />
                  <h1 className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    Reset Password
                  </h1>
                </div>
                <p className="text-[#617589] dark:text-gray-400 text-base">
                  Enter your new password below.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    Password has been reset successfully! Redirecting to login...
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {!success && (
                <>
                  {/* Password Field */}
                  <label className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-[#617589] dark:text-gray-400" />
                      <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">
                        New Password
                      </span>
                    </div>
                    <div className="flex w-full items-stretch">
                      <div className="flex-1 relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          className={`h-14 w-full rounded-r-none border-r-0 transition-all duration-200 ${
                            passwordError
                              ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900"
                              : ""
                          }`}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError(null);
                            if (error) setError(null);
                          }}
                          onBlur={() => validatePassword(password)}
                          disabled={loading || success}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPassword((s) => !s);
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={loading || success}
                        className={`flex-shrink-0 h-14 flex items-center justify-center px-4 rounded-r-lg border border-l-0 text-[#617589] dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          passwordError
                            ? "border-red-300 dark:border-red-700"
                            : "border-[#dbe0e6] dark:border-gray-700"
                        }`}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-5 transition-transform duration-200" />
                        ) : (
                          <Eye className="size-5 transition-transform duration-200" />
                        )}
                      </button>
                    </div>
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
                      <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">
                        Confirm Password
                      </span>
                    </div>
                    <div className="flex w-full items-stretch">
                      <div className="flex-1 relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          className={`h-14 w-full rounded-r-none border-r-0 transition-all duration-200 ${
                            confirmPasswordError
                              ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900"
                              : ""
                          }`}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (confirmPasswordError) setConfirmPasswordError(null);
                            if (error) setError(null);
                          }}
                          onBlur={() => validateConfirmPassword(confirmPassword)}
                          disabled={loading || success}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowConfirmPassword((s) => !s);
                        }}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        disabled={loading || success}
                        className={`flex-shrink-0 h-14 flex items-center justify-center px-4 rounded-r-lg border border-l-0 text-[#617589] dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          confirmPasswordError
                            ? "border-red-300 dark:border-red-700"
                            : "border-[#dbe0e6] dark:border-gray-700"
                        }`}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-5 transition-transform duration-200" />
                        ) : (
                          <Eye className="size-5 transition-transform duration-200" />
                        )}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 transition-all duration-200">
                        <AlertCircle className="size-3" />
                        {confirmPasswordError}
                      </p>
                    )}
                  </label>

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
                          <span>Resetting...</span>
                        </span>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
