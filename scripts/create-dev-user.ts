/**
 * scripts/create-dev-user.ts
 *
 * Creates (or upserts) a confirmed test user in Supabase Auth using the
 * credentials from DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD in .env.
 *
 * Usage: npx tsx scripts/create-dev-user.ts
 */

import { config } from "dotenv";
config({ override: true });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.DEV_LOGIN_EMAIL;
  const password = process.env.DEV_LOGIN_PASSWORD;

  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("Missing DEV_LOGIN_EMAIL or DEV_LOGIN_PASSWORD in .env");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if user already exists
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("listUsers failed:", listError.message);
    process.exit(1);
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`User ${email} already exists (id: ${existing.id})`);
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      console.error("update failed:", updateError.message);
      process.exit(1);
    }
    console.log(`✓ password reset and email confirmed`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ created confirmed user ${email} (id: ${data.user?.id})`);
}

main();
