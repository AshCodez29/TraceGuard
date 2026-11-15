# TraceGuard frontend

This is a Vite React app. Do not open `index.html` directly from Finder; the browser cannot load the JSX source modules from a `file://` URL.

From this folder, run:

```sh
npm install
npm run dev
```

Open the local URL Vite prints, with `/login?dev=1` at the end (for example, `http://localhost:5173/login?dev=1`). In the local development preview, any password works and the role selector switches between Developer, Admin, and Auditor sample views. Preview data is illustrative and does not connect to Northwind.

For a production backend, configure `VITE_API_BASE_URL`, start the backend, and sign in with a backend account. Do not use the preview login for a live deployment.
