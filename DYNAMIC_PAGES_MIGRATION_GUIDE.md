# Dynamic Pages Migration Guide

## Overview

Your static public pages (Terms of Service, Privacy Policy, How it Works, About, Contact) have been successfully migrated to use the dynamic page builder system. This allows you to manage these pages through the admin interface instead of editing code.

## What's Changed

### 1. Dynamic Page Renderer
- Created `DynamicPageRenderer` component that renders pages from database content
- Supports multiple block types: Hero, Text, CTA, Contact
- Maintains the same visual design as your original pages
- Includes fallback to static content if dynamic page not found

### 2. Updated Page Routes
All existing page routes now check for dynamic content first:
- `/terms-of-service` → Dynamic with static fallback
- `/privacy-policy` → Dynamic with static fallback  
- `/how-it-works` → Dynamic with static fallback
- `/about` → Dynamic with static fallback
- `/contact` → Dynamic with static fallback

### 3. Backward Compatibility
- If no dynamic page exists, the original static content is displayed
- No breaking changes to existing functionality
- SEO and metadata are preserved

## How to Use

### 1. Seed Sample Pages (Optional)
Run the seeding script to create sample dynamic pages:

```bash
npx tsx scripts/seed-dynamic-pages.ts
```

This creates:
- Terms of Service page with hero, content, and CTA blocks
- Privacy Policy page with hero and content blocks

### 2. Access Page Builder
1. Go to `/admin/page-builder` in your admin interface
2. You'll see the seeded pages (if you ran the script)
3. Click on any page to edit its content

### 3. Create New Dynamic Pages
1. Click "New Page" in the page builder
2. Choose page type and route (e.g., `/how-it-works`)
3. Add content blocks:
   - **Hero Block**: Page header with title, subtitle, background image
   - **Text Block**: Main content with markdown support
   - **CTA Block**: Call-to-action buttons
   - **Contact Block**: Contact information display

### 4. Edit Existing Pages
1. Select a page from the sidebar
2. Use drag-and-drop to reorder blocks
3. Click "Edit" on any block to modify content
4. Switch between English and Bahasa Malaysia
5. Click "Publish" to make changes live

## Block Types Available

### Hero Block
- Page title and subtitle
- Background image
- Call-to-action button
- Automatic color scheme based on page type

### Text Block  
- Rich text content with markdown support
- Optional title
- Full formatting capabilities

### CTA Block
- Primary and secondary buttons
- Customizable links and text
- Arrow icons optional

### Contact Block
- Email, phone, and address display
- Clickable contact links
- Responsive grid layout

## Page Type Color Schemes

The system automatically applies color schemes based on page type:
- **Terms**: Green gradient
- **Privacy**: Blue gradient  
- **How it Works**: Blue to primary gradient
- **About**: Purple gradient
- **Contact**: Orange gradient

## Migration Benefits

### For Administrators
- ✅ Edit page content without touching code
- ✅ Multi-language support built-in
- ✅ Version control and publishing workflow
- ✅ Drag-and-drop content management
- ✅ Real-time preview

### For Developers  
- ✅ Backward compatibility maintained
- ✅ No breaking changes to existing routes
- ✅ SEO and metadata preserved
- ✅ Clean separation of content and code
- ✅ Extensible block system

### For Users
- ✅ Same familiar page layouts
- ✅ Improved loading performance
- ✅ Better mobile responsiveness
- ✅ Consistent design language

## Next Steps

1. **Test the Migration**: Visit your public pages to ensure they still work
2. **Run Seeding Script**: Create sample dynamic pages to test the system
3. **Create Dynamic Content**: Use the page builder to create new dynamic versions
4. **Train Administrators**: Show them how to use the page builder interface
5. **Monitor Performance**: Ensure dynamic pages load as expected

## Troubleshooting

### Page Not Loading
- Check if the page exists in the database
- Verify the route matches exactly (including leading slash)
- Check if the page is published and active

### Content Not Displaying
- Ensure blocks are marked as visible
- Check that translations exist for the current locale
- Verify block content is valid JSON

### Styling Issues
- Dynamic pages use the same CSS classes as static pages
- Check that all required components are imported
- Verify Tailwind classes are available

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database connectivity
3. Ensure all required dependencies are installed
4. Check that the page builder admin interface is accessible

The system is designed to be robust with fallbacks, so your existing pages will continue to work even if there are issues with the dynamic system.