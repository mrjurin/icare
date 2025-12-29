# Project Structure

## Root Directory
- `src/` - Main application source code
- `drizzle/` - Database migrations and schema
- `messages/` - Internationalization files (en.json, ms.json)
- `public/` - Static assets
- `.kiro/` - Kiro AI assistant configuration and specs

## Source Code Organization (`src/`)

### Application Routes (`src/app/`)
- `[locale]/` - Internationalized routes
  - `(admin)/admin/` - Admin dashboard and management
  - `(staff)/staff/` - Staff interface
  - `(community)/community/` - Community member interface
  - Public pages (about, contact, privacy-policy, etc.)
- `api/` - API routes and server actions

### Components (`src/components/`)
- `ui/` - Reusable UI components (Button, Input, DataTable, etc.)
- `households/` - Household-specific components
- `issues/` - Issue management components
- `spr-voters/` - SPR voter components
- Root level: Shared components (headers, navigation, etc.)

### Database (`src/db/`)
- `schema.ts` - Drizzle schema definitions
- `index.ts` - Database connection
- `seed.ts` - Database seeding scripts
- `create-admin-user.ts` - Admin user creation utility

### Library Code (`src/lib/`)
- `actions/` - Server actions organized by feature
- `utils/` - Utility functions and helpers
- `supabase/` - Supabase client configuration
- `types/` - TypeScript type definitions
- `templates/` - Template definitions (page builder)

### Other Directories
- `src/contexts/` - React contexts
- `src/hooks/` - Custom React hooks
- `src/i18n/` - Internationalization configuration

## Naming Conventions

### Files & Folders
- Use kebab-case for directories: `aids-programs/`, `issue-types/`
- Use PascalCase for React components: `AidsProgramForm.tsx`
- Use camelCase for utilities and actions: `createHousehold.ts`

### Routes
- Dynamic routes use brackets: `[id]/`, `[locale]/`
- Route groups use parentheses: `(admin)/`, `(community)/`
- Nested routes follow folder structure

### Database
- Table names use snake_case: `spr_voters`, `issue_types`
- Enum names use camelCase with "Enum" suffix: `issueStatusEnum`

## Key Patterns

### Route Organization
- Role-based route grouping with layout files
- Internationalized routes under `[locale]/`
- Feature-based organization within role groups

### Component Structure
- Page components in route directories
- Shared components in `/components/`
- UI primitives in `/components/ui/`

### Data Layer
- Server actions in `/lib/actions/` by feature
- Database schema in single file with relations
- Utility functions separated by concern

### Internationalization
- All user-facing text uses next-intl
- Translation keys organized by feature
- Default locale is Malay (`ms`)