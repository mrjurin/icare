# Audit Logs Viewer & Reports Implementation

## ✅ Implementation Complete

A comprehensive audit logs viewer and reporting system has been implemented with search, filtering, and analytics capabilities.

## Files Created

### 1. Server Actions
- **`src/lib/actions/audit-logs.ts`** - Server actions for:
  - `getAuditLogs()` - Fetch audit logs with filtering and pagination
  - `getAuditLogStats()` - Get statistics and analytics
  - `exportAuditLogs()` - Export logs to CSV
  - `getAuditLogFilterOptions()` - Get available filter options

### 2. Pages & Components

#### Audit Logs Viewer
- **`src/app/[locale]/(admin)/admin/audit-logs/page.tsx`** - Main audit logs page
- **`src/app/[locale]/(admin)/admin/audit-logs/AuditLogsTable.tsx`** - Table component with:
  - Search functionality
  - Advanced filters (event type, entity type, user, success status, date range)
  - Export to CSV
  - Pagination
  - Detailed view with expandable metadata

#### Audit Reports
- **`src/app/[locale]/(admin)/admin/audit-logs/reports/page.tsx`** - Reports page
- **`src/app/[locale]/(admin)/admin/audit-logs/reports/AuditReports.tsx`** - Reports component with:
  - Summary cards (total events, success/failure counts, success rate)
  - Top event types chart
  - Top entity types chart
  - Top users chart
  - Recent activity timeline
  - Date range filtering
  - Export functionality

### 3. Translations
- **`messages/en.json`** - English translations for audit logs
- **`messages/ms.json`** - Malay translations for audit logs

## Features

### ✅ Search & Filter
- **Text Search** - Search across action, user email, event type, entity type
- **Event Type Filter** - Filter by specific event types
- **Entity Type Filter** - Filter by entity types (staff, household, issue, etc.)
- **User Filter** - Filter by specific users
- **Success Status Filter** - Filter by success/failure
- **Date Range Filter** - Filter by start and end dates
- **Reset Filters** - Clear all filters with one click

### ✅ Table Features
- **Sortable Columns** - Sorted by timestamp (newest first)
- **Expandable Details** - View full JSON metadata for each log entry
- **Status Indicators** - Visual indicators for success/failure
- **User Information** - Display user name, email, and role
- **IP Address Tracking** - Display IP address when available
- **Pagination** - Navigate through large result sets

### ✅ Reports & Analytics
- **Summary Statistics**:
  - Total events count
  - Successful operations count
  - Failed operations count
  - Success rate percentage

- **Charts & Visualizations**:
  - Top 10 Event Types (with percentages)
  - Top 10 Entity Types (with percentages)
  - Top 10 Users (with activity counts)
  - Recent Activity Timeline (last 30 days)

- **Date Range Filtering** - Filter reports by date range

### ✅ Export Functionality
- **CSV Export** - Export filtered audit logs to CSV
- **Report Export** - Export audit reports to CSV
- **Automatic Filename** - Includes date in filename

## Access Control

- **Only super_admin and ADUN** can access audit logs
- Access control enforced in all server actions
- Unauthorized access returns clear error messages

## Usage

### Viewing Audit Logs

Navigate to: `/admin/audit-logs`

1. Use the search bar to find specific logs
2. Click "Filters" to show advanced filter options
3. Select filters and click "Search"
4. Click on "View Details" to see full metadata
5. Use pagination to navigate through results
6. Click "Export CSV" to download filtered results

### Viewing Reports

Navigate to: `/admin/audit-logs/reports`

1. Optionally set date range filters
2. Click "Apply" to refresh statistics
3. View summary cards and charts
4. Click "Export Report" to download CSV

## API Usage

### Get Audit Logs

```typescript
import { getAuditLogs } from "@/lib/actions/audit-logs";

const result = await getAuditLogs({
  search: "staff",
  eventType: "staff.created",
  entityType: "staff",
  userId: 123,
  success: true,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  page: 1,
  limit: 50,
});
```

### Get Statistics

```typescript
import { getAuditLogStats } from "@/lib/actions/audit-logs";

const result = await getAuditLogStats(
  "2024-01-01", // startDate
  "2024-12-31"  // endDate
);
```

### Export Logs

```typescript
import { exportAuditLogs } from "@/lib/actions/audit-logs";

const result = await exportAuditLogs({
  eventType: "staff.created",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});
```

## Database Queries

The system uses optimized queries with:
- Indexes on frequently filtered columns
- Efficient joins for user data
- Pagination support
- Count queries for statistics

## Performance Considerations

- **Pagination** - Default 50 items per page
- **Indexed Columns** - All filter columns are indexed
- **Efficient Joins** - User data joined efficiently
- **Lazy Loading** - Details expanded on demand
- **Client-Side Filtering** - Some filters applied client-side for better UX

## Security

- **Access Control** - Only authorized users can view logs
- **Data Sanitization** - Sensitive data already sanitized in audit logs
- **CSV Export** - Properly escaped CSV data
- **Error Handling** - Graceful error handling throughout

## Future Enhancements

Potential improvements:
1. **Advanced Charts** - Add more visualizations (line charts, pie charts)
2. **Real-time Updates** - WebSocket support for live audit logs
3. **Email Alerts** - Notify admins of critical events
4. **Audit Log Retention** - Automatic archiving of old logs
5. **Advanced Search** - Full-text search with Elasticsearch
6. **Custom Reports** - User-defined report templates
7. **Scheduled Reports** - Automated report generation and email delivery

## Navigation

Add to your admin navigation menu:

```json
{
  "nav": {
    "auditLogs": "Audit Logs"
  }
}
```

Then link to:
- `/admin/audit-logs` - Audit logs viewer
- `/admin/audit-logs/reports` - Audit reports

---

**Status**: ✅ Ready for use
**Access**: Super Admin & ADUN only
**Documentation**: Complete
