# TrafficLens — Client

Frontend admin portal for the Bengaluru Traffic Police (BTP) parking enforcement intelligence system.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | Component framework |
| TypeScript | 5 | Type safety |
| Vite | 6 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling with custom BTP brand palette |
| Framer Motion | 12 | Animations and page transitions |
| React Router DOM | 7 | Client-side routing |
| Recharts | 2 | Data visualizations |
| Leaflet + React-Leaflet | 1.4 | Interactive hotspot map with H3 hexagons |
| H3-JS | 4 | Uber's hexagonal hierarchical spatial indexing |
| Lucide React | — | Icon library |
| Sonner | — | Toast notifications |

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public marketing page |
| `/login` | Login | Auth form (mock mode: any input accepted) |
| `/dashboard` | Command Center | KPIs, charts, EDI insights, activity feed |
| `/hotspots` | Hotspot Detection | H3 hexagon map with violation cluster overlays |
| `/congestion` | Congestion Impact | Blockage analysis, scatter plots, cascade network |
| `/analytics` | Operational Analytics | Enforcement trends, funnel, violations breakdown |
| `/officers` | Officer Management | Roster, pending approvals, performance table |
| `/csv-upload` | Dataset Management | Upload new datasets with live progress tracking |

## Folder Structure

```
src/
├── components/
│   ├── layout/       # AppShell, Sidebar, Topbar, PageTransition, ThemeToggle
│   └── ui/           # StatCard, Dialog, Skeleton, RiskBadge, etc.
├── config/
│   └── api.ts        # Backend connection — BASE_URL, ENDPOINTS, IS_LIVE flag
├── hooks/
│   ├── useMockData.ts    # All data hooks (auto-switches mock ↔ live API)
│   ├── useTheme.tsx      # Dark/light theme context
│   └── useMediaQuery.ts  # Responsive breakpoint detection
├── mocks/            # Static JSON mock data files
├── pages/            # One file per route
├── types/            # TypeScript interfaces matching backend schema
├── lib/
│   └── utils.ts      # cn(), formatNumber(), formatPercent(), haversineKm()
└── index.css         # Global styles and Tailwind layers
```

## Connect to Backend

1. Copy `.env.example` to `.env.local`
2. Set `VITE_API_URL` to your running server's base API path:

```env
VITE_API_URL=http://localhost:3000/api
```

3. Restart `npm run dev`

The `IS_LIVE` flag in `src/config/api.ts` becomes `true` automatically, and every data hook in `src/hooks/useMockData.ts` switches from static JSON mocks to live `fetch()` calls. No other code changes needed.

### Expected Endpoints

See `src/config/api.ts` for the full list. Key ones:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /dashboard` | GET | KPI totals for command center |
| `GET /hotspots` | GET | Array of H3 hex hotspot records |
| `GET /officers` | GET | Full officer roster |
| `GET /officers/pending` | GET | Pending registration requests |
| `POST /officers/approve` | POST | Approve a registration |
| `POST /officers/reject` | POST | Reject a registration |
| `GET /csv/history` | GET | Upload history records |
| `POST /csv/upload` | POST | Upload a new dataset CSV |

## Mock Data

All mock JSON files live in `src/mocks/`. To regenerate them:

```bash
cd ../server
python generate_mocks.py
```

This reads `server/data/Dataset.csv` and writes JSON files into `src/mocks/`.

## Build for Production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Dark / Light Mode

The theme toggle is in the top-right of the app bar. Preference is persisted in `localStorage` under the key `tl-theme`.

## Troubleshooting

See [SETUP.md](./SETUP.md) for common issues and fixes.
