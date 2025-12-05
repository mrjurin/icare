"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export default function CommunityLoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="flex w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-lg dark:bg-background-dark dark:border dark:border-gray-700">
          <div className="hidden w-1/2 lg:flex">
            <div
              className="w-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmv2CVtuNASMwZdMSvemNUs8M8rpPOUmfvweQGpyAeoi8ItTn569RZolM1Y1n9js1J7O4y7UbaCdnWdtS8rJyU_7SVoXf6f3yNc8Eg88c10upP-BjUC0TthPe2m3a-7wXiV_uUg5V7pUxTVdwYe_wnXOsdB15QYP6J-SMJLVepYX-j2kYCLoc-ilIv6uTqKe47siL52mxK_jOr1qnfC7Jd2fAsGRpWw0tqo1Uu4VlM4LygeNDgS0gKAyfJHsoFwiyMaH2Aj48qBc0")',
              }}
            />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Community Login</p>
                <p className="text-[#617589] dark:text-gray-400 text-base">Sign in to report issues and connect with your neighbors in N.18 Inanam.</p>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col">
                  <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Email or Username</p>
                  <Input placeholder="Enter your email or username" className="h-14" />
                </label>

                <label className="flex flex-col">
                  <p className="text-[#111418] dark:text-gray-300 text-base font-medium pb-2">Password</p>
                  <PasswordField />
                </label>
                <a href="#" className="text-primary text-sm self-end underline hover:text-primary/80">Forgot Password?</a>
              </div>

              <div className="flex flex-col gap-4">
                <Button className="h-14 w-full">Login</Button>
                <p className="text-[#617589] dark:text-gray-400 text-center text-sm">Don&apos;t have an account? <a className="font-medium text-primary underline hover:text-primary/80" href="/community/register">Register here</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex w-full items-stretch">
      <Input type={show ? "text" : "password"} placeholder="Enter your password" className="h-14 rounded-r-none border-r-0 pr-2" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="text-[#617589] flex border border-[#dbe0e6] bg-white items-center justify-center px-4 rounded-r-lg border-l-0 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}
