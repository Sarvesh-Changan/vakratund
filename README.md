This is the M/s. Vakratund Construction website: a database-driven Next.js site with an estimator, public lead forms, CMS-managed content, and a protected admin pipeline. Email notifications use Nodemailer over Gmail SMTP.

## Getting Started

Install dependencies and configure the environment:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Copy `.env.example` to `.env.local`. Keep secrets out of source control. For local email delivery, configure the SMTP variables with a Gmail app password; incomplete SMTP configuration safely skips email in development.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run email:test
```

See [AGENTS.md](./AGENTS.md), [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), [docs/RUNBOOK.md](./docs/RUNBOOK.md), and [docs/SECURITY.md](./docs/SECURITY.md) for project conventions, operations, and security requirements.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
