import { getDynamicPageData, generateDynamicPageMetadata, formatBlocksForRenderer } from "@/lib/utils/dynamic-pages";
import DynamicPageRenderer from "@/components/DynamicPageRenderer";
import { getSetting } from "@/lib/actions/settings";
import { notFound } from "next/navigation";

interface ContactPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const resolvedParams = await params;
  return await generateDynamicPageMetadata('/contact', resolvedParams.locale);
}

export default async function ContactPage({ params }: ContactPageProps) {
  try {
    const resolvedParams = await params;
    const data = await getDynamicPageData('/contact', resolvedParams.locale);
    const formattedBlocks = formatBlocksForRenderer(data.blocks, data.locale);

    // Get app name for the header
    const appNameResult = await getSetting("app_name");
    const appName = appNameResult.success && appNameResult.data 
      ? appNameResult.data 
      : "N.18 Inanam Platform";

    return (
      <DynamicPageRenderer
        pageTitle={data.page.title || data.page.name}
        pageDescription={data.page.description || undefined}
        blocks={formattedBlocks}
        locale={resolvedParams.locale}
        appName={appName}
      />
    );
  } catch (error) {
    console.error('Error rendering contact page:', error);
    notFound();
  }
}