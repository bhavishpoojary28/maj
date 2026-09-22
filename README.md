# RailQR AI

**AI-Based Development of Laser-Based QR Code Marking on Track Fittings for Indian Railways**

A full-stack web application that manages railway track fitting information, generates QR codes, tracks components, uses AI to inspect QR code quality, and allows photo-backed complaint registration against scanned components.

## Features

- **Authentication** — JWT-based login/register with role-based access (Admin, Railway Inspector, Maintenance Staff)
- **Dashboard** — Real-time stats: total fittings, QR codes generated, AI inspections, pass/fail counts, maintenance alerts, open complaints
- **Track Fittings Management** — Full CRUD with search, filters, pagination, and CSV export
- **QR Code Generator** — Generate unique QR codes per component; download as PNG or PDF
- **QR Scanner** — Camera-based scanning with manual lookup fallback; displays component details, inspection history, maintenance records, and complaint history. **Register Complaint** button after scanning to file a complaint against the scanned component
- **AI Inspection** — Upload laser-marked QR images for automated quality analysis (blur, alignment, contrast, damage, readability); returns PASS/FAIL with confidence % and detected problems
- **Maintenance Module** — Schedule maintenance, track status, mark complete, export logs
- **Complaints** — View and manage all registered complaints; filter by status/priority; update complaint status (Open → In Progress → Resolved/Rejected); CSV export
- **Reports** — Generate detailed PDF reports per component (QR info, AI results, complaints, maintenance history, inspector details); CSV export
- **Analytics** — Charts for monthly inspections, pass vs fail, zone analysis, component type distribution, maintenance frequency
- **Notifications** — Alerts for failed inspections, maintenance due, new components, and new complaints
- **Audit Logs** — Action trail for all CRUD operations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| QR | qrcode (generation), html5-qrcode (scanning) |
| PDF | jsPDF |
| Backend | Supabase (PostgreSQL, Auth, RLS policies) |
| AI | Canvas-based image heuristics (Laplacian variance for blur, luminance std-dev for contrast, center-of-mass for alignment) |

## Database Schema

- `profiles` — extends `auth.users` with full_name, role, zone
- `track_fittings` — railway components with QR IDs, GPS, status
- `inspections` — AI inspection results (PASS/FAIL, confidence, problems)
- `maintenance_logs` — scheduled/completed maintenance
- `complaints` — registered complaints with type, priority, status, description, photo evidence, and defect flag
- `notifications` — alert system
- `audit_logs` — action audit trail

All tables have RLS enabled. Authenticated staff share organizational data.

## Setup

```bash
npm install
npm run dev
npm run build
```

## Camera access on a phone

Browsers do not allow camera access from an HTTP address such as
`http://10.42.217.210:5173`. Use an HTTPS deployment URL or expose the local
Vite server through an HTTPS tunnel, then open that HTTPS URL on the phone and
allow the camera permission. `localhost` is also allowed, but only on the same
device running the server.

For example, while `npm run dev` is running, start a Cloudflare Quick Tunnel:

```bash
cloudflared tunnel --url http://localhost:5173
```

Open the generated `https://…trycloudflare.com` URL on the phone.

## Usage

1. Register a new account (select role: Admin / Inspector / Maintenance)
2. Add track fittings in the Track Fittings page
3. Generate QR codes (PNG/PDF) in the QR Generator
4. Scan QR codes with the QR Scanner (camera or manual entry)
5. After scanning, click **Register Complaint** to file a complaint, attach or take a defect photo, and mark it as a defect when applicable
6. Manage complaints in the Complaints page (update status, filter, export)
7. Upload QR images for AI inspection
8. Schedule and track maintenance
9. Download PDF reports and view analytics
