import { getDunName } from "@/lib/actions/settings";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CommunityFaqPage({ 
  params 
}: { 
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("faq");
  const dunName = await getDunName();
  
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{t("title")}</p>
          <p className="text-base text-gray-600 dark:text-gray-400">{t("description")}</p>
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
                <input className="flex w-full min-w-0 flex-1 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary border-none bg-white dark:bg-gray-800 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base" placeholder={t("searchPlaceholder")} />
              </div>
            </label>
          </div>

          <div className="flex gap-3 overflow-x-auto">
            <button className="h-10 shrink-0 rounded-lg bg-primary px-4 text-white text-sm font-medium">{t("filters.all")}</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">{t("filters.reportingIssues")}</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">{t("filters.accountManagement")}</button>
            <button className="h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white">{t("filters.generalInformation")}</button>
          </div>

          <div className="space-y-2">
            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4" open>
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">{t("questions.reportIssue.question")}</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">{t("questions.reportIssue.answer")}</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">{t("questions.trackStatus.question")}</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">{t("questions.trackStatus.answer")}</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">{t("questions.resetPassword.question")}</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">{t("questions.resetPassword.answer")}</p>
            </details>

            <details className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                <p className="text-base font-medium text-gray-900 dark:text-white">{t("questions.platformPurpose.question")}</p>
                <span className="text-gray-900 dark:text-white">▾</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">{t("questions.platformPurpose.answer", { dunName })}</p>
            </details>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-200 dark:border-gray-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">?</div>
            <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{t("cantFindAnswer.title")}</p>
            <p className="mx-auto max-w-md text-sm text-gray-600 dark:text-gray-400 mt-1">{t("cantFindAnswer.description")}</p>
            <Link 
              href={`/${locale}/community/support`}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary/90"
            >
              {t("cantFindAnswer.contactSupport")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
