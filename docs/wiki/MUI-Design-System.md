# 🎨 Material-UI (MUI v7) Design System

The application uses **Material-UI (MUI v7)** as its default enterprise design system.

### Reusable Shared Components

* **`Button`**: Accessible button with primary, secondary, danger, and subtle variants.
* **`EmptyState`**: Standard empty card with contextual icon, title, description, and primary/secondary call-to-action buttons.
* **`ErrorState`**: Clinical alert box with title, error message, actionable retry button, and technical error code accordion.
* **`Pagination`**: Pagination bar supporting item ranges, page jumper, and page-size selector.
* **`SearchInput`**: Input with prefix search icon, clear button, and keyboard navigation.
* **`UIStateSwitcher`**: Live developer tool allowing immediate previewing of loading, error, empty, and success states across views.
* **`Avatar` & `StatusBadge`**: Clinic staff initials, profile icons, and clinical workflow pills.

### Technical Exceptions for Tailwind CSS

As documented in [`docs/01_PROJECT/tailwind-exception-report.md`](https://github.com/Abdo2000-1/newcp-ui-option-a/blob/main/docs/01_PROJECT/tailwind-exception-report.md), Tailwind CSS utility classes are strictly retained only for:
1. `TeethChart.tsx`: Absolute canvas overlay positioning and WebGL viewport layering.
2. `DicomMprViewer.tsx`: Pixel-precise MPR slice grid controls.
