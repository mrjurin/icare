import { getSetting } from "@/lib/actions/settings";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { HelpCircle, ArrowRight } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

export default async function HowItWorksPage() {
  const contentResult = await getSetting("page_how_it_works_content");
  const content = contentResult.success && contentResult.data 
    ? contentResult.data 
    : `# How It Works

## Simple Steps to Make a Difference

### 1. Spot & Report
Easily submit a detailed report about any issue you encounter in the community. Use our simple form to describe the problem, add photos, and pinpoint the location on a map.

### 2. Community & Authority Review
Your report is reviewed by community moderators and relevant local authorities. They assess the issue and determine the best course of action.

### 3. Track Progress & Resolution
Follow the status of your report from submission to final resolution. Get updates on actions taken and see how your report contributes to making N.18 Inanam better.

## Your Voice, Our Community

**Transparent Tracking**: Monitor the progress of every report from submission to resolution in real-time.

**Direct Communication**: Engage with local authorities and neighbors to work together on solutions.

**Collective Problem-Solving**: Be part of a community that actively contributes to making N.18 Inanam better.`;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-primary dark:from-blue-600 dark:via-blue-700 dark:to-primary p-8 md:p-12 lg:p-16">
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <HelpCircle className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  How It Works
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  Learn how our platform makes it easy for you to report issues and make a positive impact in your community
                </p>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <Button asChild className="rounded-lg h-12 px-6 bg-white text-primary text-base font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    <Link href="/report-issue" className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="w-full max-w-4xl px-4 md:px-0 py-10 md:py-20">
          <div className="mb-8">
            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              {content.split('\n').map((line, index) => {
                // Check if line starts with # for headings
                if (line.trim().startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mb-4">{line.replace(/^# /, '')}</h1>;
                } else if (line.trim().startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mb-3 mt-6">{line.replace(/^## /, '')}</h2>;
                } else if (line.trim().startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mb-2 mt-4">{line.replace(/^### /, '')}</h3>;
                } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                  return <p key={index} className="font-bold mb-2">{line.replace(/\*\*/g, '')}</p>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index} className="mb-3">{line}</p>;
                }
              })}
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
              <Link href="/report-issue">Report an Issue Now</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/community/login">Create an Account</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
