import { getDynamicPageData, generateDynamicPageMetadata, formatBlocksForRenderer } from "@/lib/utils/dynamic-pages";
import DynamicPageRenderer from "@/components/DynamicPageRenderer";
import { getSetting } from "@/lib/actions/settings";
import { notFound } from "next/navigation";

interface DynamicPageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: DynamicPageProps) {
  const resolvedParams = await params;
  const route = `/${resolvedParams.slug.join('/')}`;
  return await generateDynamicPageMetadata(route, resolvedParams.locale);
}

export default async function DynamicPage({ params }: DynamicPageProps) {
  try {
    const resolvedParams = await params;
    const route = `/${resolvedParams.slug.join('/')}`;
    const data = await getDynamicPageData(route, resolvedParams.locale);
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
        locale={data.locale}
        appName={appName}
      />
    );
  } catch (error) {
    console.error('Error rendering dynamic page:', error);
    notFound();
  }
}