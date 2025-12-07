# Database Seed Script

This directory contains the database seed script to populate the database with sample data for development and testing.

## Usage

To seed the database with sample data, run:

```bash
npm run db:seed
```

Or directly with npx:

```bash
npx tsx src/db/seed.ts
```

## What it does

The seed script will:

1. **Clear existing data** - Truncates all tables (in the correct order to respect foreign key constraints)
2. **Insert sample data** for all tables:
   - **Profiles** (5 sample community members)
   - **Staff** (5 staff members including ADUN, staff manager, and field officers)
   - **Issues** (6 sample issues with various statuses and categories)
   - **Issue Media** (5 images attached to issues)
   - **Issue Feedback** (4 comments/feedback entries)
   - **Issue Assignments** (3 assignments of issues to staff)
   - **Announcements** (4 community announcements)
   - **Notifications** (5 notifications for users)
   - **Support Requests** (4 support requests with various statuses)

## Requirements

- Database must be set up and migrations must be run
- `DATABASE_URL` environment variable must be set
- All tables must exist (run migrations first: `npm run drizzle:migrate`)

## Notes

- The script uses `TRUNCATE` with `RESTART IDENTITY CASCADE` to clear data, which resets auto-increment counters
- All foreign key relationships are maintained in the sample data
- Sample data includes realistic Malaysian addresses and phone numbers for the N.18 Inanam community
