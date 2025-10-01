# Tailwind CSS v4 Configuration Guide

## Key Changes in Tailwind CSS v4

### 1. Import Statement Changes
Replace the old `@tailwind` directives with a single `@import`:

```css
/* Old v3 way */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New v4 way */
@import "tailwindcss";
```

### 2. PostCSS Configuration
Update your `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  }
}
```

### 3. Container Utility Customization
In v4, customize the container using `@utility` directive:

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

### 4. Theme Configuration with CSS Variables
Define theme variables using `@theme`:

```css
@theme {
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 120rem;
  --color-avocado-100: oklch(0.99 0 0);
  --color-avocado-200: oklch(0.98 0.04 113.22);
}
```

### 5. Automatic Upgrade Tool
Use the automated upgrade tool:

```bash
npx @tailwindcss/upgrade
```

### 6. JavaScript Config Loading
If you need to use a JavaScript config file, explicitly load it:

```css
@config "../../tailwind.config.js";
```

### 7. Default Ring Behavior
To preserve v3 ring behavior:

```css
@theme {
  --default-ring-width: 3px;
  --default-ring-color: var(--color-blue-500);
}
```

### 8. Dialog Element Centering
Re-center dialog elements in v4:

```css
@layer base {
  dialog {
    margin: auto;
  }
}
```

### 9. High-Contrast Dark Theme Tokens
Tailwind v4 expects color tokens to be declared once in `@theme` and then overridden per theme scope.
Keep shared references inside `@theme inline`, and scope your light/dark values in `@layer base`.

```css
@import "tailwindcss";

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
}

@layer base {
  :root {
    color-scheme: light;
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --border: 214 32% 91%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --input: 214 32% 91%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 210 40% 98%;
    --ring: 221 83% 53%;
  }

  .dark {
    color-scheme: dark;
    --background: 222 47% 6%;
    --foreground: 210 40% 96%;
    --border: 217 25% 26%;
    --muted: 217 25% 16%;
    --muted-foreground: 215 20% 70%;
    --accent: 215 21% 24%;
    --accent-foreground: 210 40% 96%;
    --card: 222 47% 8%;
    --card-foreground: 210 40% 96%;
    --popover: 222 47% 10%;
    --popover-foreground: 210 40% 96%;
    --input: 217 25% 26%;
    --primary: 226 70% 60%;
    --primary-foreground: 210 40% 98%;
    --secondary: 215 20% 20%;
    --secondary-foreground: 210 40% 96%;
    --destructive: 0 65% 55%;
    --destructive-foreground: 210 40% 96%;
    --ring: 226 70% 60%;
  }
}
```

## Integration with Build Tools

### Vite Configuration
For Vite projects, add the Tailwind plugin:

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

### Component-Scoped Styles
For Vue/Svelte/Astro, use CSS variables in scoped styles:

```html
<template>
  <button><slot /></button>
</template>

<style scoped>
  button {
    background-color: var(--color-blue-500);
  }
</style>
```

## Performance Optimizations
- Imports and vendor prefixing are handled automatically
- `postcss-import` and `autoprefixer` can often be removed
- CSS variables provide better performance for component-scoped styles
