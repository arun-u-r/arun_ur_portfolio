# Arun U R — Creative Developer Portfolio

A responsive portfolio landing page featuring a real-time, GPU-driven black-hole
scene built with Next.js App Router, React Three Fiber, and Three.js. Particle
positions and the accretion disk are animated in custom shaders; the scene does
not use prerecorded footage or external 3D assets.

## Requirements

- Node.js 20.9 or newer
- pnpm (the repository uses pnpm 12)

## Setup

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.
Use `pnpm build` to create a production build and `pnpm start` to serve it.

## Portfolio content

- Edit the headline, introduction, and navigation labels in
  `src/components/portfolio/portfolio-data.ts`.
- The single page at `/` contains Home, Projects, About, and Contact sections.
  Navigation uses the `#home`, `#projects`, `#about`, and `#contact` anchors.
- Replace the clearly marked project and biography placeholders in
  `src/components/portfolio/portfolio-data.ts` and
  `src/components/portfolio/AboutContactSections.tsx` with your own details.
  Project links are intentionally omitted until real URLs are provided.
- The Contact form posts to `src/app/api/contact/route.ts`. Configure the
  server-only variables below in `.env.local` (or your deployment provider):
  `RESEND_API_KEY`, `CONTACT_EMAIL`, and `EMAIL_FROM`.
- The API requires `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` for shared, durable rate limiting (five requests
  per client IP per ten minutes). It returns a service-unavailable response
  rather than falling back to per-instance memory if the limiter is missing or
  unavailable. Configure the deployment proxy to provide a trustworthy
  `x-real-ip` or append the visitor address to `x-forwarded-for`.
- To enable Resend, create an API key and verify the sender domain used by
  `EMAIL_FROM` in the Resend dashboard. Set `CONTACT_EMAIL` to your own
  receiving address. The sender must be a verified address/domain accepted by
  Resend; no addresses or secrets are included in this repository.
- After setting the variables, run the app and submit the form at `/#contact`.
  A successful response confirms Resend accepted the message submission; it
  does not guarantee final inbox delivery. Sending cannot be verified until
  valid Resend credentials, a verified sender, and the Redis rate-limit
  credentials are configured and tested.
- To test the endpoint independently, send a JSON `POST` to `/api/contact`
  with `name`, `email`, `subject`, and `message` fields. The browser never
  provides the destination address; `CONTACT_EMAIL` is used on the server.
- The Contact section includes a lazily loaded, procedural Earth visual, and
  the footer name-orbit graphic is an SVG/CSS animation. Both respect reduced
  motion; no additional packages or external texture downloads are required.
- `BlackHoleScene` loads the scene client-side; `BlackHoleSceneCanvas` renders
  it with React Three Fiber.
- `ParticleField` computes orbital paths, inward acceleration, cursor
  disturbance, and click ripples in a vertex shader.
- `AccretionDisk` renders layered blue, violet, and amber light with a custom
  fragment shader.
- The scene adapts particle count and pixel ratio for mobile and lower-powered
  devices, and honors `prefers-reduced-motion`.
- The canvas is decorative and does not intercept navigation or text input.
  Browsers without WebGL receive a CSS-rendered fallback.
