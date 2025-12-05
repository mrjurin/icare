"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { MessageSquare, Eye, EyeOff } from "lucide-react";

export default function CommunityRegisterPage() {
  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <a href="#" className="text-primary flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="size-6" aria-hidden />
              <span>N.18 Inanam Community Hub</span>
            </a>
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Join the N.18 Inanam Community</p>
              <p className="text-[#617589] dark:text-gray-400 text-base">Create an account to report issues and connect with your neighbors.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-4">
              <label className="flex w-full flex-col">
                <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Full Name</p>
                <Input placeholder="Enter your full name" className="h-14" />
              </label>
              <label className="flex w-full flex-col">
                <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Email Address</p>
                <Input type="email" placeholder="Enter your email address" className="h-14" />
              </label>
              <label className="flex w-full flex-col">
                <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Password</p>
                <PasswordField placeholder="Create a password" />
              </label>
              <label className="flex w-full flex-col">
                <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Confirm Password</p>
                <ConfirmPasswordField placeholder="Confirm your password" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-primary focus:ring-primary/50" id="terms" type="checkbox" />
              <label className="text-sm text-[#617589] dark:text-gray-400" htmlFor="terms">
                I agree to the <a className="font-medium text-primary hover:underline" href="#">Terms of Service</a> and <a className="font-medium text-primary hover:underline" href="#">Privacy Policy</a>.
              </label>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button className="h-14 w-full">Create Account</Button>
              <p className="text-sm text-[#617589] dark:text-gray-400">
                Already have an account? <a className="font-medium text-primary hover:underline" href="/community/login">Log In</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ placeholder }: { placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex w-full items-stretch">
      <Input type={show ? "text" : "password"} placeholder={placeholder} className="h-14 rounded-r-none border-r-0 pr-2" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="text-[#617589] flex items-center justify-center border border-l-0 border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark rounded-r-lg px-4 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

function ConfirmPasswordField({ placeholder }: { placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex w-full items-stretch">
      <Input type={show ? "text" : "password"} placeholder={placeholder} className="h-14 rounded-r-none border-r-0 pr-2" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="text-[#617589] flex items-center justify-center border border-l-0 border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-background-dark rounded-r-lg px-4 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

