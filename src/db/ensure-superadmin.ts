// Script to ensure superadmin exists in database and Supabase Auth
// This runs automatically on local development startup
// Run with: npx tsx src/db/ensure-superadmin.ts

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createClient } from "@supabase/supabase-js";
import { staff } from "./schema";
import { eq } from "drizzle-orm";

// Load .env file from project root
config({ path: resolve(process.cwd(), ".env") });

const adminEmail = "administrator@n18inanam.gov.my";
const adminPassword = "123456";
const adminName = "Administrator";

async function ensureSuperadmin() {
  // Only run in development/local environment
  if (process.env.NODE_ENV === "production") {
    console.log("⏭️  Skipping superadmin creation in production");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not set, skipping superadmin creation");
    return;
  }

  // Fail silently if database connection fails (database might not be ready yet)
  let pool: Pool | null = null;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY not set, skipping Supabase Auth user creation");
    console.log("   You can still create the staff record, but will need to set up auth manually");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("⚠️  NEXT_PUBLIC_SUPABASE_URL not set, skipping Supabase Auth user creation");
  }

  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000, // Shorter timeout for faster startup
    });

    const db = drizzle(pool);
    // 1. Check if staff record exists
    const existingStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.email, adminEmail))
      .limit(1);

    let staffId: number;
    let staffCreatedOrUpdated = false;

    if (existingStaff.length > 0) {
      staffId = existingStaff[0].id;
      
      // Update password if needed (ensure it's active and has correct role)
      if (existingStaff[0].status !== "active" || existingStaff[0].role !== "super_admin") {
        await db
          .update(staff)
          .set({
            status: "active",
            role: "super_admin",
            updatedAt: new Date(),
          })
          .where(eq(staff.id, staffId));
        console.log("✅ Updated superadmin staff record");
        staffCreatedOrUpdated = true;
      }
    } else {
      // Create staff record
      console.log("➕ Creating superadmin staff record...");
      const [newStaff] = await db
        .insert(staff)
        .values({
          name: adminName,
          email: adminEmail,
          phone: "+60 88-123 4999",
          role: "super_admin",
          position: "Administrator",
          status: "active",
        })
        .returning();
      
      staffId = newStaff.id;
      console.log(`✅ Created superadmin staff record (ID: ${staffId})`);
      staffCreatedOrUpdated = true;
    }

    // 2. Create/update Supabase Auth user
    let authCreatedOrUpdated = false;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error(`   ⚠️  Error listing users: ${listError.message}`);
          console.log("   Continuing without auth user creation...");
        } else {
          const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
          );

          if (existingUser) {
            // Update password to ensure it's set correctly (silently if no error)
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              password: adminPassword,
              email_confirm: true,
            });

            if (updateError) {
              console.error(`   ⚠️  Error updating password: ${updateError.message}`);
            } else {
              authCreatedOrUpdated = true;
            }
          } else {
            // Create new user
            console.log("   ➕ Creating Supabase Auth user...");
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: adminEmail.toLowerCase(),
              password: adminPassword,
              email_confirm: true,
              user_metadata: {
                full_name: adminName,
                staff_id: staffId,
              },
            });

            if (createError) {
              console.error(`   ⚠️  Error creating user: ${createError.message}`);
            } else {
              console.log(`   ✅ Created Supabase Auth user`);
              authCreatedOrUpdated = true;
            }
          }
        }
      } catch (error) {
        console.error(`   ⚠️  Error with Supabase Auth:`, error);
        console.log("   Continuing without auth user creation...");
      }
    }

    // Only show success message if something was actually created or updated
    if (staffCreatedOrUpdated || authCreatedOrUpdated) {
      console.log("\n✨ Superadmin setup complete!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`\n🎉 You can now login at /admin/login`);
    }
  } catch (error) {
    // Fail silently in dev mode to not block server startup
    // Errors are logged but don't throw to allow dev server to start
    console.error("⚠️  Error ensuring superadmin (continuing anyway):", error instanceof Error ? error.message : error);
    console.log("   You can manually run: npm run ensure-superadmin");
  } finally {
    if (pool) {
      await pool.end().catch(() => {
        // Ignore errors when closing pool
      });
    }
  }
}

// Run if executed directly
if (require.main === module) {
  ensureSuperadmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export default ensureSuperadmin;
