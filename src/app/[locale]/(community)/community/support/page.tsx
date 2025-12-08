import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function CommunitySupportPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">Contact Support</p>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Have a question, feedback, or a technical issue with the platform? Fill out the form below and our team will get back to you. For community-related issues, please use the &apos;Report a New Issue&apos; button.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Name</span>
                  <Input placeholder="Enter your name" className="h-14" />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Email Address</span>
                  <Input type="email" placeholder="Enter your email address" className="h-14" />
                </label>
              </div>

              <label className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Subject</span>
                <Input placeholder="What is your message about?" className="h-14" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Message</span>
                <textarea className="min-h-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Please describe your question or issue in detail here..." />
              </label>

              <div className="flex justify-end">
                <Button className="h-12 px-6">Send Message</Button>
              </div>
            </form>
          </div>
        </section>

        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Other Ways to Reach Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">For direct assistance, you can also reach us through the following channels. We typically respond within 24 hours.</p>
            <div className="space-y-4">
              <a className="flex items-center gap-4" href="mailto:support@n18inanam.gov">
                <div className="flex items-center justify-center size-10 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">✉️</div>
                <div className="min-w-0 max-w-full">
                  <p className="text-gray-900 dark:text-white font-medium hover:text-primary break-all">support@n18inanam.gov</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email us directly</p>
                </div>
              </a>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-10 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">📞</div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">+60 88-123 4567</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mon–Fri, 9am–5pm</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
