---
name: Loading Overlay Hook System
overview: Implement a hook-based loading overlay system that automatically shows a full-screen overlay for async operations triggered by clicks, with both explicit hook usage and automatic button detection.
todos:
  - id: create-context
    content: Create LoadingOverlayContext with provider component in src/contexts/LoadingOverlayContext.tsx
    status: completed
  - id: create-overlay
    content: Create LoadingOverlay component in src/components/ui/LoadingOverlay.tsx with full-screen overlay UI
    status: completed
  - id: create-hook
    content: Create useLoadingOverlay hook in src/hooks/useLoadingOverlay.ts with withLoading wrapper function
    status: completed
  - id: enhance-button
    content: Enhance Button component to automatically detect and wrap async onClick handlers
    status: completed
  - id: integrate-provider
    content: Add LoadingOverlayProvider to root layout.tsx
    status: completed
  - id: test-integration
    content: Test the system with existing async operations to ensure it works correctly
    status: completed
---

# Loading Overlay Hook System Implementation

## Overview

Create a reusable, hook-based loading overlay system that automatically displays a full-screen overlay during async operations. The system will support both explicit usage via hooks and automatic detection for button clicks.

## Architecture

### Components to Create

1. **`src/components/ui/LoadingOverlay.tsx`**

   - Full-screen overlay component with backdrop
   - Centered spinner (using `Loader2` from lucide-react)
   - Optional loading message
   - Blocks all user interactions (pointer-events, z-index)

2. **`src/contexts/LoadingOverlayContext.tsx`**

   - React Context for managing global loading state
   - Provider component that wraps the app
   - State management for loading status and optional message

3. **`src/hooks/useLoadingOverlay.ts`**

   - Main hook that provides:
     - `withLoading(fn)` - Wraps async functions to show/hide overlay
     - `setLoading(boolean)` - Manual control
     - `isLoading` - Current loading state
   - Automatically handles try/catch/finally for overlay visibility

4. **Enhanced `src/components/ui/Button.tsx`**

   - Detect async onClick handlers
   - Automatically wrap with loading overlay
   - Show spinner in button while loading (optional enhancement)
   - Maintain backward compatibility

## Implementation Details

### LoadingOverlay Component

- Fixed position covering entire viewport
- Semi-transparent backdrop (e.g., `bg-black/50`)
- Centered spinner with optional text
- High z-index (e.g., `z-50`) to appear above all content
- Smooth fade-in/out transitions

### LoadingOverlayContext

- Single source of truth for loading state
- Supports optional loading message
- Prevents multiple overlays from conflicting
- Uses React state with proper cleanup

### useLoadingOverlay Hook

```typescript
const { withLoading, setLoading, isLoading } = useLoadingOverlay();

// Explicit usage
const handleClick = withLoading(async () => {
  await someAsyncOperation();
});

// Manual control
setLoading(true);
try {
  await operation();
} finally {
  setLoading(false);
}
```

### Button Enhancement

- Detect if onClick handler returns a Promise
- Automatically wrap with loading overlay
- Optionally show inline spinner
- Preserve existing Button API

## Integration Points

1. **`src/app/layout.tsx`**

   - Wrap children with `LoadingOverlayProvider`
   - Place after `NextIntlClientProvider` for proper context hierarchy

2. **Existing Components**

   - No breaking changes required
   - Components can opt-in to use the hook
   - Button component automatically handles async clicks

## File Structure

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx (enhanced)
│       └── LoadingOverlay.tsx (new)
├── contexts/
│   └── LoadingOverlayContext.tsx (new)
└── hooks/
    └── useLoadingOverlay.ts (new)
```

## Benefits

- Centralized loading state management
- Consistent UX across all async operations
- Easy to maintain and extend
- Non-intrusive - existing code continues to work
- Type-safe with TypeScript
- Automatic cleanup and error handling