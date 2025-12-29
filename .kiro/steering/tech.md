# Technology Stack

## Framework & Runtime
- **Next.js 16** with App Router and proxy.ts as middleware
- **React 19** with TypeScript
- **Node.js** runtime

## Database & ORM
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Supabase** for authentication and real-time features

## Styling & UI
- **Tailwind CSS 4** for styling
- **Radix UI** components for accessible primitives
- **Lucide React** for icons
- **Leaflet** with React Leaflet for maps

## Internationalization
- **next-intl** for i18n support
- Supported locales: `ms` (Malay - default), `en` (English)
- Translation files in `/messages/` directory

## Key Libraries
- **@dnd-kit** for drag-and-drop functionality (page builder)
- **Lexical** for rich text editing
- **Zod** for schema validation
- **react-markdown** for markdown rendering

## Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Drizzle Kit** for database migrations

## Common Commands

### Development
```bash
npm run dev          # Start dev server with superadmin setup
npm run dev:only     # Start dev server without superadmin setup
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run drizzle:generate    # Generate migrations
npm run drizzle:migrate     # Run migrations
npm run drizzle:studio      # Open Drizzle Studio
npm run db:push             # Push schema changes
npm run db:seed             # Seed database
npm run ensure-superadmin   # Create/ensure superadmin user
```

### Environment Setup
- Copy `.env.example` to `.env`
- Configure `DATABASE_URL` for PostgreSQL connection
- Set up Supabase credentials for authentication

## Middleware & Security
- Proxy middleware (`src/proxy.ts`) handles:
  - Internationalization routing
  - Supabase authentication
  - Route protection for admin/staff areas
  - Dynamic page routing

## Build Configuration
- Server actions body size limit: 50MB (for CSV uploads)
- Image optimization configured for Google, Unsplash, and Supabase domains
- Turbopack enabled for faster builds