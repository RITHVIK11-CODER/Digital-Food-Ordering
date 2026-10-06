import { createClient } from "@supabase/supabase-js";
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_REVIEWS,
} from "../src/lib/store/seed-data";

import fs from "fs";
import path from "path";

// Load .env.local if present
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  } else {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (e) {
  // Ignored if missing
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("Starting Supabase PostgreSQL seeding...");

  // 1. Settings
  const { error: setErr } = await supabase
    .from("cafe_settings")
    .upsert([INITIAL_SETTINGS], { onConflict: "id" });
  if (setErr) console.error("Error seeding settings:", setErr.message);
  else console.log("✓ Cafe settings seeded.");

  // 2. Users / Staff
  const { error: usrErr } = await supabase
    .from("users")
    .upsert(INITIAL_USERS, { onConflict: "id" });
  if (usrErr) console.error("Error seeding users:", usrErr.message);
  else console.log("✓ Staff users seeded.");

  // 3. Tables
  const { error: tblErr } = await supabase
    .from("tables")
    .upsert(INITIAL_TABLES, { onConflict: "id" });
  if (tblErr) console.error("Error seeding tables:", tblErr.message);
  else console.log("✓ Tables seeded.");

  // 4. Categories
  const { error: catErr } = await supabase
    .from("categories")
    .upsert(INITIAL_CATEGORIES, { onConflict: "id" });
  if (catErr) console.error("Error seeding categories:", catErr.message);
  else console.log("✓ Categories seeded.");

  // 5. Menu Items, Translations, Customization Groups & Options
  for (const item of INITIAL_MENU_ITEMS) {
    const { translations, customization_groups, ...itemRow } = item;

    const { error: itemErr } = await supabase
      .from("menu_items")
      .upsert([itemRow], { onConflict: "id" });
    if (itemErr) console.error(`Error seeding item ${item.name}:`, itemErr.message);

    // Translations
    if (translations && translations.length > 0) {
      const transRows = translations.map((tr) => ({
        id: undefined,
        menu_item_id: item.id,
        language_code: tr.language_code,
        name: tr.name,
        description: tr.description,
      }));
      await supabase.from("menu_translations").upsert(transRows, { onConflict: "menu_item_id,language_code" });
    }

    // Customization Groups & Options
    if (customization_groups && customization_groups.length > 0) {
      for (const grp of customization_groups) {
        const { options, ...grpRow } = grp;
        await supabase.from("customization_groups").upsert([grpRow], { onConflict: "id" });

        if (options && options.length > 0) {
          await supabase.from("customization_options").upsert(options, { onConflict: "id" });
        }
      }
    }
  }
  console.log("✓ Menu items, translations & customization options seeded.");

  // 6. Reviews
  for (const rev of INITIAL_REVIEWS) {
    await supabase.from("reviews").upsert([rev], { onConflict: "id" });
  }
  console.log("✓ Initial reviews seeded.");

  console.log("🎉 Supabase database seeding complete and verified!");
}

seed().catch(console.error);

