import { loadStandaloneEnv, printEnvironmentLoadError } from "../src/lib/standalone-env.ts";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  loadStandaloneEnv();
  const email = argument("--email")?.trim().toLowerCase();
  const all = process.argv.includes("--all");
  const force = process.argv.includes("--force");
  if (process.env.NODE_ENV === "production" && !force) throw new Error("Refusing to change production lockouts without --force.");
  if ((email && all) || (!email && !all)) throw new Error("Use exactly one of --email <email> or --all.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("--email must be a valid email address.");

  // The CLI uses the direct Neon connection for maintenance, without displaying it.
  if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
  const { clearAllLoginLockouts, clearLoginLockout } = await import("../src/lib/rate-limit/login.ts");
  if (all) await clearAllLoginLockouts();
  else await clearLoginLockout(email as string);
  console.log(all ? "All login lockouts cleared." : "Login lockout cleared.");
} catch (error) {
  if (error instanceof Error) console.error(error.message);
  else printEnvironmentLoadError(error);
  process.exitCode = 1;
}
