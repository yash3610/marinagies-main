# Website and dashboard integration

Run the existing backend with npm run dev --prefix backend and the combined frontend with npm run dev --prefix frontend.

The website opens at /. Login and register use /api/auth and navigate to /dashboard after saving the common session. Dashboard routes verify /api/auth/me before mounting.

Website source: frontend/src/website. Original dashboard source stays in frontend/src/pages, components and layouts. Website assets are in frontend/public/assets. index.html and dashboard.html deliberately use separate CSS and JavaScript entry points so Bootstrap, Tailwind, themes and animations cannot affect the other interface. Vite serves both through one port and one build. Crossing between the two interfaces performs a full navigation.

Website forms: backend/src/website, mounted at /api/forms. Existing dashboard APIs and Socket.IO keep their URLs. The common auth controller supports dashboard password and legacy website passwordHash records in the configured database. Public registration always assigns BRIDGE_OFFICER. Existing admin roles are unchanged.

Migration audit: the legacy database contained no users, contacts or service requests, and one newsletter subscriber. That subscriber was backed up in C:\Users\techn\Downloads\marineaegis-data-backup-1788605094191, copied into the main database and verified. The source record and the three existing main database accounts were preserved. Configure the existing backend MONGO_URI and JWT_SECRET as before; do not overwrite them with the old server environment file. Previously issued website tokens must be renewed by logging in.

For production run npm run build --prefix frontend, then run the backend with NODE_ENV=production. It serves website, dashboard, API and sockets on one origin. Other static hosts must send /dashboard and /dashboard/* to dashboard.html and public page routes to index.html. Optional VITE_API_URL and VITE_SOCKET_URL can point to a separate backend.

The original MarineAegis folder is retained as the source reference; it is not required to run the merged app. Neither database seeding nor external form submission is needed for building.

Validation: npm run build --prefix frontend; node --test backend/tests/merged-app.test.js. Integration tests use mocked user persistence and do not write to a database.
