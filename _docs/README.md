# Adom Medical Centre — Hospital Management System

Monorepo-style project with a **React frontend** and a **Node/Express backend**, all in one `hospital` folder.

```
hospital/
├── package.json          # root scripts (run both apps with one command)
├── README.md
├── backend/              # REST API — Express + TypeScript
│   └── src/
│       ├── index.ts      # server entry (port 3001)
│       ├── store.ts      # in-memory database + enrichment helpers
│       ├── data/         # demo datasets (Ghanaian fictional data)
│       ├── routes/       # auth, patients, appointments, people, pharmacy,
│       │                 # laboratory, records, billing, misc
│       └── utils/        # date helpers
└── frontend/             # React + Vite + TypeScript SPA (port 5173)
    └── src/
        ├── services/     # API client — every call goes to the backend
        ├── pages/        # dashboard, patients, appointments, billing, …
        ├── components/   # reusable UI library + charts
        └── …
```

## Running the app

```bash
# from the hospital/ root — installs both apps
npm run install:all

# start backend (port 3001) and frontend (port 5173) together
npm run dev

# …or run them separately in two terminals
npm run dev:backend
npm run dev:frontend
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` requests to the backend,
so the frontend and API work as one app.

## Architecture

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4, React Router, Recharts |
| Backend  | Node.js, Express 4, TypeScript (tsx for dev)      |

- The frontend **never touches mock data directly** — every page consumes `src/services/*`,
  which call the backend through a single `apiClient` (`fetch` wrapper with bearer-token auth).
- The backend keeps an **in-memory database** seeded from `backend/src/data/` and exposes a
  REST API (`/api/auth/login`, `/api/patients`, `/api/appointments`, `/api/medicines`,
  `/api/lab-tests`, `/api/invoices`, `/api/prescriptions`, …).
- To move to a real database later, replace `store.ts` with a PostgreSQL/MongoDB repository
  behind the same routes — the frontend needs no changes.

## Demo accounts

| Role                    | Email                              | Password        |
| ----------------------- | ---------------------------------- | --------------- |
| Administrator           | admin@adommedicalcentre.gh         | `admin123`      |
| Doctor                  | doctor@adommedicalcentre.gh        | `doctor123`     |
| Nurse                   | nurse@adommedicalcentre.gh         | `nurse123`      |
| Receptionist            | reception@adommedicalcentre.gh     | `reception123`  |
| Pharmacist              | pharmacy@adommedicalcentre.gh      | `pharmacy123`   |
| Laboratory Technician   | lab@adommedicalcentre.gh           | `lab123`        |
| Accountant              | accountant@adommedicalcentre.gh    | `accountant123` |

## Useful commands

```bash
npm run build          # production build of the frontend
npm run typecheck      # typecheck both apps
npm run test:smoke     # Playwright end-to-end smoke test (needs both apps running)
npm run test:roles     # role-based access + mobile drawer checks
```

## API overview

| Method | Endpoint                         | Purpose                                   |
| ------ | -------------------------------- | ----------------------------------------- |
| POST   | `/api/auth/login`                | Sign in → `{ token, user }`               |
| GET    | `/api/auth/me`                   | Current user for the stored token         |
| GET    | `/api/patients?q=&doctorId=`     | List/search patients                      |
| POST   | `/api/patients`                  | Register a patient                        |
| PATCH  | `/api/patients/:id`              | Update a patient                          |
| GET    | `/api/appointments?patientId=`   | List (enriched) appointments              |
| POST   | `/api/appointments`              | Schedule an appointment                   |
| PATCH  | `/api/appointments/:id/status`   | Check-in / start / complete / cancel      |
| GET    | `/api/appointments/trend`        | 7-day appointment counts                  |
| GET    | `/api/doctors` / `/api/nurses`   | Staff lists (with stats)                  |
| GET    | `/api/departments`               | Departments                               |
| GET    | `/api/medicines`                 | Medicine inventory (with expiry)          |
| PATCH  | `/api/medicines/:id/stock`       | Adjust stock                              |
| GET    | `/api/prescriptions?patientId=`  | Prescriptions                             |
| POST   | `/api/prescriptions/:id/dispense`| Dispense + decrement stock                |
| GET    | `/api/lab-tests?patientId=`      | Laboratory tests                          |
| PATCH  | `/api/lab-tests/:id/result`      | Enter a result (marks completed)          |
| GET    | `/api/medical-records?patientId=`| Clinical timeline                         |
| GET    | `/api/invoices?patientId=`       | Invoices (with paid/balance)              |
| POST   | `/api/invoices/:id/payments`     | Record a payment                          |
| GET    | `/api/staff`                     | Staff directory                           |
| GET    | `/api/notifications`             | Notifications                             |
| GET    | `/api/search?q=`                 | Global search (patients + doctors)        |

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

## Notes

- All data is fictional demo data stored in memory — restarting the backend resets mutations.
- Themes and the sign-in session persist in the browser (`localStorage`).
- Full design-system, module and testing documentation lives in `frontend/README.md`.
