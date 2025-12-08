export default function CommunityFaqPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">Frequently Asked Questions</p>
          <p className="text-base text-gray-600 dark:text-gray-400">Find answers to common questions about reporting issues and managing your account.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <div className="space-y-6">
          <div>
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full items-stretch rounded-xl h-full shadow-sm">
                <div className="text-gray-500 dark:text-gray-400 flex bg-white dark:bg-gray-800 items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <span className="text-2xl">🔍</span>
                </div>
                <input className="flex w-full min-w-0 flex-1 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary border-none bg-white dark:bg-gray-800 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base" placeholder="How can we help?" />
              </div>
            </label>
          </div>

          <div className="flex gap-3 overflow-x-auto">
            <button className="h-10 shrink-0 rounded-lg bg-primary px-4 text-white text-sm font-medium">All</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">Reporting Issues</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">Account Management</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">General Information</button>
          </div>

          <div className="space-y-2">
            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4" open>
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">How do I report a new issue like a pothole or broken streetlight?</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">To report a new issue, click on the &apos;Report a New Issue&apos; in the sidebar. Fill out the form with details about the issue, including its location, a description, and a photo if possible. Once submitted, you&apos;ll receive a confirmation and a tracking number.</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">How can I track the status of my reported issue?</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">You can track the status of any issue you&apos;ve reported by navigating to the &apos;Dashboard&apos; from the sidebar. There you will find a list of all your submissions and their current status, such as &apos;Pending&apos;, &apos;In Progress&apos;, or &apos;Resolved&apos;.</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">How do I reset my password?</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">If you&apos;ve forgotten your password, go to the Login page and select the &apos;Forgot Password?&apos; link. Enter your registered email address, and we will send you a link to reset your password.</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">What is the purpose of this platform?</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">This platform enables residents of N.18 Inanam to report local community issues, track their resolution, and stay informed about community developments. Our goal is to foster a responsive and collaborative environment.</p>
            </details>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-200 dark:border-gray-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">?</div>
            <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Can&apos;t find an answer?</p>
            <p className="mx-auto max-w-md text-sm text-gray-600 dark:text-gray-400 mt-1">Our team is here to help. Reach out to us for any questions you can&apos;t find answers to.</p>
            <button className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary/90">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
