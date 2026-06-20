# TrafficLens — Setup & Troubleshooting

## Common Issues

### Leaflet map markers not showing (broken icon image)

The default Leaflet marker icons use `require()` which breaks with Vite. The project uses custom SVG markers to avoid this. If you still see broken marker icons after changes:

```ts
// Add to src/main.tsx, after the leaflet CSS import:
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow })
```

---

### H3-JS bundler errors

If you see `Cannot use 'in' operator to search for 'exports'` or a similar CommonJS/ESM conflict:

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['h3-js'],
  },
})
```

---

### Tailwind dark mode not applying

Ensure `tailwind.config.js` has `darkMode: 'class'` (not `'media'`). The `ThemeProvider` in `src/hooks/useTheme.tsx` toggles the `dark` class on `<html>` — if that class is missing, no dark styles render.

---

### Vite environment variables not picked up

- Variables must be prefixed with `VITE_` to be exposed to the browser bundle.
- The file must be named `.env.local` (not `.env`) for Vite to load it without committing it.
- After editing `.env.local`, **restart the dev server** — Vite does not hot-reload env files.

```env
# .env.local
VITE_API_URL=http://localhost:3000/api
```

Access in code: `import.meta.env.VITE_API_URL`

---

### Port conflicts

Default Vite dev port is 5173. To change it:

```ts
// vite.config.ts
export default defineConfig({
  server: { port: 3001 },
})
```

---

### TypeScript errors after pulling

```bash
npm install          # ensure all packages are present
npx tsc --noEmit     # check types without building
```

---

### Recharts tooltip import collision

The project has a custom `<Tooltip>` component. All Recharts tooltip imports use an alias to avoid the name clash:

```ts
import { Tooltip as RechartsTip } from 'recharts'
```

If you add a new chart, always use this alias — importing `Tooltip` directly will shadow the UI component and cause a runtime error.

---

### Map not rendering (white box)

Leaflet requires an explicit height on the map container. Make sure the wrapping div has a fixed or percentage height, not just `min-height`:

```tsx
<MapContainer style={{ height: '100%', width: '100%' }} ...>
```

The parent element must also have a resolved height (not just `auto`).

---

### TypeScript: `moduleResolution: bundler` warnings

This project uses `"moduleResolution": "bundler"` and `"verbatimModuleSyntax": true`. Use `import type` for type-only imports:

```ts
import type { Hotspot } from '../types'  // correct
import { Hotspot } from '../types'       // error — verbatimModuleSyntax requires the `type` keyword
```

---

### Framer Motion v12 breaking changes

Framer Motion v12 removed several v10/v11 APIs. Key ones used in this project:

- Use `animate()` from `'framer-motion'` (the standalone function) for imperative animations.
- `viewport={{ once: true }}` still works on `whileInView`.
- `AnimatePresence mode="wait"` is unchanged.
