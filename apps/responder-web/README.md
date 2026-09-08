# MediPass Public Responder Web

React + TypeScript + Vite website opened from a MediPass QR code.

Primary owner: Team Member 2.

Purpose:

- responder scans QR using a normal phone camera
- browser opens the public MediPass URL
- site calls `GET /api/v1/public/passes/{token}`
- active pass => show only allowed emergency categories
- invalid token => 404 state
- expired/revoked => 410 state

Rules:

- no responder account required
- no direct Supabase access
- do not store public pass tokens in localStorage
- never display categories not returned by the backend
- design mobile-first and high-contrast for emergency readability
