# Runbook

## Retired Cloudinary content

Existing assets are not deleted automatically. If cleanup is approved, delete the `vakratund/blog` folder manually from the Cloudinary Media Library/dashboard after confirming that no retained records or backups need those assets.

## Secret configuration

## Gallery migration and Cloudinary cleanup

Deploy the Gallery schema migration with `npm run db:deploy`, then run `npm run db:seed` to add the default categories and years. Existing gallery rows are assigned to the year from `createdAt`; verify the assignments in `/admin/gallery` before publishing.

Gallery deletion removes database metadata and attempts best-effort Cloudinary cleanup. Existing Cloudinary assets are never bulk-deleted by the migration. If an old folder must be removed, use the Cloudinary dashboard manually and delete only the approved `vakratund/gallery` assets after confirming they are unused.

`BETTER_AUTH_SECRET` signs Better Auth sessions and `IP_HASH_SECRET` hashes IP addresses before they are stored in activity logs. Keep both values only in `.env.local` for local development and in the hosting provider's encrypted environment settings for deployment. Never commit them, print them, or place them in `NEXT_PUBLIC_` variables.

Generate each value independently with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add the generated values to `.env.local`, then verify without displaying them:

```bash
npm run check:env
```

The check prints only `OK` or `FAIL` beside each variable name. Both values must be at least 32 characters, must not be placeholders, and must be different from one another. The application validates them lazily when authentication, rate limiting, or privacy logging first needs them; missing or invalid values produce a secret-free error naming only the variable.

## Rotation

To rotate either secret, generate a new value and replace only that variable in `.env.local` or the hosting provider's encrypted environment settings. Restart or redeploy the application and run `npm run check:env` in the target environment.

- Rotating `BETTER_AUTH_SECRET` invalidates existing session signatures and signs everyone out. Users must log in again.
- Rotating `IP_HASH_SECRET` changes the hash for future IP addresses. Existing stored IP hashes cannot be correlated with new hashes, and IP-based rate-limit history resets.

Rotate both independently; never reuse one value for the other.

## Clearing login lockouts

The maintenance command accepts an email or all buckets. It prints only a completion message and refuses production unless explicitly forced:

```bash
npm run auth:unlock -- --email admin@example.com
npm run auth:unlock -- --all
npm run auth:unlock -- --email admin@example.com --force   # production only
```

The command uses Upstash when both REST variables are configured; otherwise it uses the database bucket table. Apply the rate-limit migration before using the database fallback in production.

## CI and production builds

CI test jobs receive secrets through GitHub Actions secrets named `BETTER_AUTH_SECRET` and `IP_HASH_SECRET`. The build-only job uses `SKIP_ENV_VALIDATION=1` during Next.js's explicit production build phase so a build does not require runtime secrets. This flag must never be configured in a production runtime environment. A production server must start with real secrets and will reject `SKIP_ENV_VALIDATION=1` outside the build phase.

## Failure response

If `npm run check:env` fails, inspect only the variable names reported by the command. Check for missing values, accidental whitespace, values shorter than 32 characters, placeholder text, or the two values being identical. Do not paste the values into logs, tickets, chat, or source control.

## Gmail SMTP email

The application sends transactional email through Nodemailer using Gmail SMTP. Configure these variables in `.env.local` or the hosting provider's encrypted settings:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
EMAIL_FROM
LEAD_NOTIFY_TO
```

For a Gmail account:

1. Turn on 2-Step Verification for the sending Google account.
2. Open Google Account → Security → App passwords.
3. Create an app password for the website (Google may require re-authentication).
4. Put the generated app password in `SMTP_PASS`; do not use the normal Gmail password.
5. Set `SMTP_USER` to the Gmail address and make the email address inside `EMAIL_FROM` exactly match it.
6. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, and `SMTP_SECURE=false` for STARTTLS, or use the approved secure SMTP configuration for the selected port.
7. Set `LEAD_NOTIFY_TO` to one or more comma-separated notification addresses.
8. Run `npm run email:test`. It prints only `OK` or a non-secret error code.

Never commit `.env.local`, print SMTP values, or put SMTP values in `NEXT_PUBLIC_` variables. In development, incomplete SMTP configuration produces one secret-free `email disabled: SMTP not configured` line and skips delivery. Production validation fails fast when the email variables are missing or inconsistent.

### Rotate or revoke the app password

Create a new app password in Google Account → Security → App passwords, replace only `SMTP_PASS`, and redeploy or restart the application. After verifying delivery, delete the old app password in Google. If the account is compromised, revoke the old app password immediately and review recent account activity before restoring delivery.

### Gmail limits

Gmail may restrict sending after more than 500 recipients in a single message or more than 500 recipients in a day for many consumer accounts; limits can vary by account and Google may temporarily block unusual activity. The application is intended for transactional lead notifications, not bulk campaigns. Check Google's current [Gmail sending limits](https://support.google.com/mail/answer/22839) before increasing volume. If lead volume approaches these limits, move to a domain mailbox or transactional provider.

### Moving to a domain mailbox

The email application code does not need to change. Replace only the SMTP variables with the domain mailbox provider's host, port, secure mode, user, password/app password, matching `EMAIL_FROM`, and notification recipients. Confirm SPF, DKIM, DMARC, TLS, and provider sending limits with the mailbox provider.

### Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| `EAUTH` or SMTP 535 authentication error | Wrong app password, 2-Step Verification disabled, or wrong SMTP user | Create/revoke the app password, confirm `SMTP_USER`, and retry `npm run email:test`. |
| `EMAIL_FROM` validation error | The address in `EMAIL_FROM` differs from `SMTP_USER` | Use the same sender address; Gmail requires the authenticated address. |
| Sign-in blocked or suspicious-login alert | Google blocked a new location, device, or SMTP client | Review Google Account security alerts, confirm the account, then retry without exposing credentials. |
| `SMTP_NOT_CONFIGURED` | One or more SMTP values are missing | Check variable names only with `npm run check:env` and configure the missing values. |
| Email marked spam | Sender reputation or missing domain authentication | Check spam, use a domain mailbox, and configure SPF/DKIM/DMARC before production volume grows. |

## Windows environment and seeded admin troubleshooting

Standalone commands use the same precedence as Next.js: shell variables first, then `.env.local` over `.env` for local development. At startup they print environment-file names and variable counts only.

- If a command reports `re-save .env.local as UTF-8`, open `.env.local` in an editor that can choose encoding and save it as UTF-8 without UTF-16 or a BOM. Do not paste the file contents into logs or support requests.
- Keep each variable in one local file where possible. If the same name exists in `.env` and `.env.local`, the `.env.local` value is the local override; a value already supplied by the PowerShell process takes precedence over both files. Remove stale duplicates when the source of a value is unclear.
- In PowerShell, verify configuration without displaying values with `npm run check:env`. It reports only failed variable names and short reasons.
- After confirming database connectivity, run `npm run db:seed`. The seed upserts the configured admin, refreshes its credential hash, enables it, and forces a password change. It prints only `admin user ready: SUPER_ADMIN` for that step.
- To verify the seeded account in Prisma Studio, run `npm run db:studio`, open `User`, and confirm the configured admin row has role `SUPER_ADMIN`, `isActive` set to `true`, `emailVerified` set to `true`, and `mustChangePassword` set to `true`. Open the related `Account` row and confirm a credential account exists; never inspect, copy, or export its password hash.
| EmailLog shows `FAILED` | SMTP or recipient failure | Inspect the non-PII `errorCode`, correct configuration, and use the lead detail retry action. |

