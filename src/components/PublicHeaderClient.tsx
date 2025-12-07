"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Menu, X } from "lucide-react";

interface PublicHeaderClientProps {
  appName: string;
}

export default function PublicHeaderClient({ appName }: PublicHeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              How It Works
            </Link>
            <Link href="/view-reports" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              View Reports
            </Link>
            <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex gap-3">
            <Button asChild className="rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
              <Link href="/report-issue">Report an Issue</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-5">
              <Link href="/community/login">Login / Register</Link>
            </Button>
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
              How It Works
            </Link>
            <Link 
              href="/view-reports" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              View Reports
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button asChild className="w-full rounded-lg h-12 bg-primary text-white font-bold">
                <Link href="/report-issue" onClick={() => setMobileMenuOpen(false)}>Report an Issue</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href="/community/login" onClick={() => setMobileMenuOpen(false)}>Login / Register</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
