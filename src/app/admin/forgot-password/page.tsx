"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Mail, AlertCircle, Loader2, CheckCircle2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Validate email
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    // Validate email
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    setLoading(true);

    try {
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || "An error occurred. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
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
                    Forgot Password?
                  </h1>
                </div>
                <p className="text-[#617589] dark:text-gray-400 text-base">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out opacity-100">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    Password reset link has been sent to your email. Please check your inbox and follow the instructions.
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
                  {/* Email Field */}
                  <label className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-[#617589] dark:text-gray-400" />
                      <span className="text-[#111418] dark:text-gray-300 text-sm font-semibold">
                        Email Address
                      </span>
                    </div>
                    <Input
                      type="email"
                      placeholder="admin@n18inanam.gov.my"
                      className={`h-14 transition-all duration-200 ${
                        emailError
                          ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900"
                          : ""
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
                          <span>Sending...</span>
                        </span>
                      ) : (
                        "Send Reset Link"
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
