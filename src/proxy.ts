import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of routes that should be handled by the dynamic page system
  const DYNAMIC_ROUTES = [
    '/terms-of-service',
    '/privacy-policy',
    '/how-it-works',
    '/about',
    '/contact',
    '/view-reports'
  ];

  // Check if this is a dynamic route that needs to be redirected
  // Extract locale and route from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length >= 2) {
    const locale = pathSegments[0];
    const route = '/' + pathSegments.slice(1).join('/');
    
    // Check if this is a dynamic route that needs to be redirected
    if (DYNAMIC_ROUTES.includes(route)) {
      // Redirect to the dynamic handler
      const dynamicUrl = new URL(`/${locale}/dynamic${route}`, request.url);
      return NextResponse.rewrite(dynamicUrl);
    }
  }

  // 1. Handle i18n routing first (this creates the response with locale)
  const response = handleI18nRouting(request);

  // 2. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // 3. Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Protect Routes
  const isProtectedAdmin = pathname.includes("/admin") && !pathname.includes("/login");
  const isProtectedStaff = pathname.includes("/staff") && !pathname.includes("/login");
  const isProtectedCommunity = pathname.includes("/community") &&
    !pathname.includes("/login") &&
    !pathname.includes("/register") &&
    !pathname.includes("/faq");

  if (!user && (isProtectedAdmin || isProtectedStaff)) {
    const url = request.nextUrl.clone();

    // Determine locale to redirect to
    const segments = pathname.split("/");
    const locale = segments[1];
    const supportedLocales = routing.locales;
    const hasLocale = supportedLocales.includes(locale as any);

    if (hasLocale) {
      url.pathname = `/${locale}/staff/login`;
    } else {
      url.pathname = `/${routing.defaultLocale}/staff/login`;
    }

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // - … if they start with `/ms/admin` (direct route, not locale)
    "/((?!api|_next|_vercel|ms/admin|.*\\..*).*)"
  ]
};
