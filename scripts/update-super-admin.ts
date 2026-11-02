import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";
import { assertPasswordPolicy } from "../src/lib/auth/password-policy.ts";
import {
  loadStandaloneEnv,
  printEnvironmentLoadError,
} from "../src/lib/standalone-env.ts";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  loadStandaloneEnv();
  const email = argument("--email")?.trim().toLowerCase();
  const password = argument("--password");
  const name = argument("--name")?.trim();
  const oldEmail = argument("--old-email")?.trim().toLowerCase();
  const forceChange = !process.argv.includes("--no-force-change");

  if (!email || !password) {
    console.error(
      "Usage: npm run auth:super-admin -- --email <new-email> --password <new-password> [--name <name>] [--old-email <existing-email>]",
    );
    process.exit(1);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error("Error: --email must be a valid email address.");
    process.exit(1);
  }

  assertPasswordPolicy(password);

  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL or DIRECT_URL is missing.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    let user = oldEmail
      ? await prisma.user.findUnique({ where: { email: oldEmail } })
      : await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

    const passwordHash = await hashPassword(password);

    if (user) {
      console.log(`Found existing super admin: ${user.email} (ID: ${user.id})`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          ...(name ? { name } : {}),
          role: "SUPER_ADMIN",
          isActive: true,
          mustChangePassword: forceChange,
        },
      });

      const credentialAccount = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });

      if (credentialAccount) {
        await prisma.account.update({
          where: { id: credentialAccount.id },
          data: { password: passwordHash },
        });
      } else {
        await prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: passwordHash,
          },
        });
      }

      const sessions = await prisma.session.deleteMany({
        where: { userId: user.id },
      });
      console.log(`Revoked ${sessions.count} active session(s).`);
    } else {
      console.log(
        "No existing SUPER_ADMIN found. Creating new SUPER_ADMIN user...",
      );
      user = await prisma.user.create({
        data: {
          name: name || "Vakratund Administrator",
          email,
          emailVerified: true,
          role: "SUPER_ADMIN",
          isActive: true,
          mustChangePassword: forceChange,
        },
      });

      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
        },
      });
    }

    console.log(`\nSuper admin successfully updated:`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(
      `- Must Change Password on first sign-in: ${forceChange ? "Yes" : "No"}`,
    );
  } finally {
    await prisma.$disconnect();
  }
} catch (error) {
  if (error instanceof Error) console.error(`Error: ${error.message}`);
  else printEnvironmentLoadError(error);
  process.exitCode = 1;
}

