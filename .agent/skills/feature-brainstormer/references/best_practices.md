# Best Practices Guide

This document outlines best practices to consider when brainstorming and implementing new features.

## General Web Development

### Performance
- **Minimize Bundle Size**: Use code splitting, lazy loading, and tree shaking.
- **Optimize Images**: Use WebP/AVIF formats, proper sizing, and lazy loading.
- **Database Optimization**: proper indexing, query optimization, and connection pooling.
- **Caching Strategy**: Implement browser caching, server-side caching (e.g., Redis), and CDN usage.

### Security
- **Input Validation**: Validate all user inputs on both client and server sides.
- **Authentication/Authorization**: Use standard protocols (OAuth2, JWT) and robust role-based access control (RBAC).
- **Data Protection**: Encrypt sensitive data at rest and in transit (HTTPS).
- **Dependency Management**: Regularly audit and update dependencies to fix vulnerabilities.

### Accessibility (a11y)
- **Semantic HTML**: Use proper tags (`<header>`, `<nav>`, `<main>`, `<footer>` etc.).
- **Keyboard Navigation**: Ensure all interactive elements are reachable and usable via keyboard.
- **ARIA Attributes**: Use ARIA labels and roles where necessary, but prefer semantic HTML.
- **Contrast Ratios**: Ensure sufficient contrast between text and background.

## Architectural Patterns

### Clean Architecture
- **Separation of Concerns**: Divide the application into independent layers (Entities, Use Cases, Interfaces, Frameworks).
- **Dependency Rule**: Source code dependencies can only point inwards. Inner layers should not know about outer layers.

### Atomic Design (Frontend)
- **Atoms**: Basic building blocks (buttons, inputs).
- **Molecules**: Groups of atoms bonded together (search form).
- **Organisms**: Complex UI components (header, footer).
- **Templates**: Page-level layout structure.
- **Pages**: Specific instances of templates.

## Project Specific Context (Heuristics)

*When analysing the current project, look for:*

- **Tech Stack**:
    - **Next.js**: Use Server Components where possible for performance. Use API routes for backend logic.
    - **React**: Functional components and Hooks.
    - **Tailwind CSS**: Use utility classes, avoid custom CSS files if possible.
    - **Supabase/Firebase**: specific security rules and data modeling patterns.

- **Coding Style**:
    - Consistency with existing ESLint/Prettier configs.
    - Naming conventions (camelCase, PascalCase, etc.).
