# Angular Project Guidelines

## Table of Contents
1. [General Principles](#general-principles)
2. [Tech Stack & Component Rules](#tech-stack--component-rules)
3. [Project Architecture](#project-architecture)
4. [Component Structure](#component-structure)
5. [Styling Rules](#styling-rules)
6. [Language & Localization](#language--localization)
7. [Theming](#theming)
8. [Code Quality Standards](#code-quality-standards)
9. [Environment Configuration](#environment-configuration)

---

## General Principles

### DRY Principle (Don't Repeat Yourself)
- **Never duplicate code** - Extract common logic into reusable services, components, or utilities
- **Reuse over recreate** - Always check if functionality already exists before creating new code
- **Modular design** - Break down complex logic into small, reusable pieces

### Core Values
1. **Reusability** - All components, services, and utilities must be reusable
2. **Modularity** - Each module should have a single, well-defined purpose
3. **Maintainability** - Code should be easy to understand, modify, and extend
4. **Scalability** - Architecture must support growth without major refactoring

---

## Tech Stack & Component Rules

### Mandatory Packages

| Package | Purpose |
|---|---|
| **PrimeNG** | All UI components (tables, forms, dialogs, buttons, etc.) |
| **Tailwind CSS v4** | Layout, spacing, responsive design (with native RTL) |
| **ApexCharts + ng-apexcharts** | All charts and data visualizations |
| **PrimeIcons** | Icons inside PrimeNG components |
| **@ng-icons/core** | Standalone icons in templates |

> **Banned:** Bootstrap, NgBootstrap, or any other CSS framework. Never write inline styles unless absolutely necessary.

### Component Selection — Decision Flowchart

Before creating any UI element, always ask:

1. **Does PrimeNG have this?** → Use the PrimeNG module
2. **Is this a layout/spacing issue?** → Use Tailwind utility classes
3. **Is this a chart?** → Use ApexCharts
4. **Is this an icon?** → Use PrimeIcons or @ng-icons

**Never build a component manually if PrimeNG already has it.**

### PrimeNG Components

Import each PrimeNG module individually (standalone):

```typescript
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
```

**Common mappings:**

| Need | PrimeNG Component |
|---|---|
| Tables | `p-table` (`TableModule`) |
| Forms | `p-inputtext`, `p-dropdown`, `p-calendar` |
| Dialogs | `p-dialog` (`DialogModule`) |
| Buttons | `p-button` (`ButtonModule`) |
| Notifications | `p-toast` (`ToastModule`) |
| Cards | `p-card` (`CardModule`) |
| Menus | `p-menu`, `p-sidebar` |
| Loading | `p-skeleton`, `p-progressspinner` |

### Tailwind CSS — Layout & Spacing

Use Tailwind utility classes for **ALL** layout and spacing:

```html
<!-- ❌ WRONG: custom CSS for layout -->
<div style="display: flex; gap: 16px; padding: 16px;">

<!-- ✅ CORRECT: Tailwind utilities -->
<div class="flex gap-4 p-4">
```

### RTL-Aware Classes (Tailwind v4 Logical Properties)

Tailwind v4 has **native RTL support** via CSS logical properties. Always use directional-safe classes:

| ✅ Use (RTL-safe) | ❌ Never use |
|---|---|
| `ms-4` (margin-inline-start) | `ml-4` |
| `me-4` (margin-inline-end) | `mr-4` |
| `ps-4` (padding-inline-start) | `pl-4` |
| `pe-4` (padding-inline-end) | `pr-4` |
| `start-0` | `left-0` |
| `end-0` | `right-0` |

### Dark Mode with Tailwind

Use the `dark:` variant for dark mode overrides:

```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### Charts — ApexCharts

Always use ApexCharts for any chart or graph:

```typescript
import { NgApexchartsModule } from 'ng-apexcharts';
```

Charts **must** support RTL:

```typescript
chart: {
  fontFamily: 'inherit',
  locales: [],
  defaultLocale: 'ar',
}
```

### Icons

- **Inside PrimeNG components:** Use PrimeIcons
  ```html
  <p-button icon="pi pi-user" />
  ```
- **Standalone in templates:** Use @ng-icons
  ```typescript
  import { NgIconComponent, provideIcons } from '@ng-icons/core';
  ```

---

## Project Architecture

### Base Component Pattern

All common components **must extend** from `BaseComponent`:

```typescript
// core/base/base.component.ts
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();
  isLoading = false;
  error: string | null = null;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected handleError(error: any): void {
    this.error = error.message || 'An error occurred';
    this.isLoading = false;
  }
}
```

**Usage:**
```typescript
export class UserComponent extends BaseComponent {
  // Automatic subscription cleanup via destroy$
  // Shared loading and error handling
}
```

### Base Service Pattern

All feature services **must extend** from `BaseService`:

```typescript
// core/base/base.service.ts
export abstract class BaseService<T> {
  constructor(
    protected http: HttpClient,
    protected endpoint: string
  ) {}

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${environment.apiUrl}/${this.endpoint}`);
  }

  getById(id: string | number): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}/${this.endpoint}/${id}`);
  }

  create(item: T): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}/${this.endpoint}`, item);
  }

  update(id: string | number, item: T): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}/${this.endpoint}/${id}`, item);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/${this.endpoint}/${id}`);
  }
}
```

**Usage:**
```typescript
@Injectable({ providedIn: 'root' })
export class UserService extends BaseService<User> {
  constructor(http: HttpClient) {
    super(http, 'users');
  }
  
  // Add custom methods specific to users
}
```

---

## Component Structure

### File Organization

**Every component MUST have exactly 3 files:**

```
component-name/
├── component-name.html    # Template
├── component-name.css     # Styles
└── component-name.ts      # Logic
```

### Component Responsibilities

1. **Single Responsibility** - Each component should do one thing well
2. **Small and Focused** - Keep components under 200 lines when possible
3. **Shared Components** - Place reusable UI elements in `shared/` module
4. **Smart vs Presentational**:
   - **Smart Components**: Handle data fetching and business logic
   - **Presentational Components**: Display data via `@Input()` and emit events via `@Output()`

### Change Detection Strategy

Use `OnPush` change detection when possible for better performance:

```typescript
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

---

## Styling Rules

### Unit Standards

**ALWAYS use `rem` instead of `px`:**

```scss
// ❌ WRONG
.button {
  font-size: 16px;
  padding: 10px 20px;
  margin: 15px;
}

// ✅ CORRECT
.button {
  font-size: 1rem;
  padding: 0.625rem 1.25rem;
  margin: 0.9375rem;
}
```

### CSS Variables

Define all design tokens in `:root` inside `styles/variables.css`:

```css
/* styles/variables.css */
:root {
  /* Brand Colors */
  --color-primary: #027373;
  --color-primary-light: #038C7F;
  --color-secondary: #038C7F;
  --color-accent: #A9D9D0;
  --color-warm: #F2E7DC;
  --color-dark: #0D0D0D;
  --color-success: #038C7F;
  --color-danger: #c0392b;
  --color-warning: #e67e22;

  /* Text colors */
  --text-primary: #0D0D0D;
  --text-secondary: #3a3a3a;
  --text-muted: #7a7a7a;
  --text-on-primary: #ffffff;

  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #F2E7DC;
  --bg-tertiary: #A9D9D0;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  --gradient-accent: linear-gradient(135deg, var(--color-primary), var(--color-accent));

  /* Font sizes */
  --font-xs: 0.75rem;
  --font-sm: 0.875rem;
  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.25rem;
  --font-2xl: 1.5rem;
  --font-3xl: 1.875rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(2, 115, 115, 0.08);
  --shadow-md: 0 4px 6px -1px rgba(2, 115, 115, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(2, 115, 115, 0.12);
}
```

### Reusability

**Never hardcode values** - Always use CSS variables:

```css
/* ❌ WRONG */
.card {
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
  color: #1f2937;
}

/* ✅ CORRECT */
.card {
  background: var(--bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}
```

### Gradients

Use gradient variables for prominent surfaces like footers or active states:

```css
/* ❌ WRONG */
.footer {
  background: linear-gradient(135deg, #027373, #038C7F);
}

/* ✅ CORRECT */
.footer {
  background: var(--gradient-primary);
  color: var(--text-on-primary);
}
```

---

## Language & Localization

### Translation System Overview

The project uses a **custom translation system** (no third-party libraries like `ngx-translate`). It consists of:

- `TranslationService` (`core/services/translation.service.ts`) — loads JSON files, manages language state
- `TranslatePipe` (`core/pipes/translate.pipe.ts`) — template pipe for resolving translation keys

### TranslationService

A singleton service that loads translations from JSON files and resolves dot-notation keys:

```typescript
@Injectable({ providedIn: 'root' })
export class TranslationService {
  currentLang = signal<Language>('ar');
  translations = signal<any>({});

  // Resolves dot-notation keys, e.g. 'navbar.home' → translations.navbar.home
  translate(key: string): string { ... }

  // Switches language and updates document dir/lang attributes
  setLanguage(lang: Language): void { ... }
  toggleLanguage(): void { ... }
}
```

### TranslatePipe

A standalone, impure pipe that delegates to `TranslationService.translate()`:

```typescript
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string): string {
    return this.translationService.translate(key);
  }
}
```

> **Note:** The pipe is `pure: false` so it re-evaluates when the language signal changes.

### Translation Files

**Never hardcode text** - All text must come from translation files:

```json
// public/i18n/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "navbar": {
    "home": "Home",
    "services": "Services",
    "contact": "Contact"
  }
}
```

```json
// public/i18n/ar.json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء"
  },
  "navbar": {
    "home": "الرئيسية",
    "services": "الخدمات",
    "contact": "تواصل"
  }
}
```

### Template Usage

Import `TranslatePipe` in each standalone component and use it in templates:

```html
<!-- ❌ WRONG -->
<button>Save</button>

<!-- ✅ CORRECT -->
<button>{{ 'common.save' | translate }}</button>
```

### Supported Languages

- **Arabic (ar)** - RTL support (default language)
- **English (en)** - LTR support

---

## Theming

### Dark Mode & Light Mode

Theme switching is driven by the `data-theme` attribute on `<html>`. All theme-variant values are CSS variables overridden in `[data-theme="dark"]`:

```css
/* Light theme (default) — :root */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #F2E7DC;
  --bg-tertiary: #A9D9D0;
  --text-primary: #0D0D0D;
  --text-secondary: #3a3a3a;
  --text-muted: #7a7a7a;
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  --gradient-accent: linear-gradient(135deg, var(--color-primary), var(--color-accent));
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #0D0D0D;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --text-primary: #F2E7DC;
  --text-secondary: #A9D9D0;
  --text-muted: #7a7a7a;
  --gradient-primary: linear-gradient(135deg, #038C7F, #027373);
  --gradient-accent: linear-gradient(135deg, #027373, #A9D9D0);
}
```

### Gradient Variables

| Variable | Purpose | Usage Example |
|---|---|---|
| `--gradient-primary` | Primary brand gradient (teal tones) | Footer background, active navbar item |
| `--gradient-accent` | Accent gradient (teal → mint) | Available for hero sections, cards |

When using gradients, always pair with `--text-on-primary` for contrast:

```css
.element-with-gradient {
  background: var(--gradient-primary);
  color: var(--text-on-primary);
}
```

### Theme Service

Singleton service that manages theme state via Angular signals, persists to `localStorage`, and updates the `data-theme` attribute:

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme = signal<'light' | 'dark'>('light');

  // Reads saved theme from localStorage on init
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { ... }

  toggleTheme(): void { ... }

  get theme() {
    return this.currentTheme.asReadonly();
  }
}
```

---

## Code Quality Standards

### Naming Conventions

- **Components**: `PascalCase` - `UserListComponent`
- **Services**: `PascalCase` + `Service` - `UserService`
- **Interfaces**: `PascalCase` - `User`, `UserResponse`
- **Variables/Functions**: `camelCase` - `getUserById`, `isLoading`
- **Constants**: `UPPER_SNAKE_CASE` - `API_BASE_URL`
- **Files**: `kebab-case` - `user-list.component.ts`

### Type Safety

Always use interfaces and models:

```typescript
// ✅ CORRECT
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export class UserComponent {
  users: User[] = [];
  selectedUser: User | null = null;
}
```

### Comments

Add comments for complex logic:

```typescript
// ✅ Good comment - explains WHY
// We debounce the search to avoid excessive API calls
// while the user is still typing
this.searchControl.valueChanges
  .pipe(debounceTime(300))
  .subscribe(value => this.search(value));
```

---

## Environment Configuration

### Environment Files

Store all configuration in environment files:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],
  itemsPerPage: 10
};
```

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com/api',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],
  itemsPerPage: 20
};
```

### Usage

```typescript
// ❌ WRONG
const apiUrl = 'http://localhost:3000/api';

// ✅ CORRECT
import { environment } from '@env/environment';
const apiUrl = environment.apiUrl;
```

---

## Conflict Resolution

If any requested code conflicts with these guidelines:

1. **Stop and suggest** a better solution that follows the rules
2. **Explain why** the alternative is better
3. **Provide examples** of the correct implementation
4. **Never violate** DRY, reusability, or architectural principles

---

## Quick Checklist

Before committing code, verify:

- [ ] Component has exactly 3 files (.html, .css, .ts)
- [ ] Extends BaseComponent if applicable
- [ ] Service extends BaseService if applicable
- [ ] All sizes use `rem` units
- [ ] All values use CSS variables
- [ ] No hardcoded text (uses translation keys)
- [ ] Supports both themes (light/dark)
- [ ] Supports both languages (en/ar)
- [ ] Uses environment variables for config
- [ ] Follows naming conventions
- [ ] Has proper TypeScript types/interfaces
- [ ] No duplicate code (DRY principle)
- [ ] Uses PrimeNG components (no custom UI when PrimeNG has it)
- [ ] Uses Tailwind for layout/spacing (no custom CSS for layout)
- [ ] Uses RTL-safe classes (ms-, me-, ps-, pe-, start-, end-)
- [ ] Charts use ApexCharts with RTL config
- [ ] Icons use PrimeIcons or @ng-icons
