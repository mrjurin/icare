// Script to create Administrator user in Supabase Auth
// Run with: npx tsx src/db/create-admin-user.ts

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env file from project root
config({ path: resolve(process.cwd(), ".env") });

const adminEmail = "administrator@n18inanam.gov.my";
const adminPassword = "123456";

async function createAdminUser() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set!");
    console.error("   Please add it to your .env file.");
    console.error("   You can find it in Supabase Dashboard → Settings → API → service_role key");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set!");
    process.exit(1);
  }

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

    console.log("🔍 Checking if user already exists...");
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Error listing users:", listError.message);
      process.exit(1);
    }

    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    if (existingUser) {
      console.log(`⚠️  User ${adminEmail} already exists in Supabase Auth`);
      console.log("🔄 Updating password...");
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: adminPassword,
        email_confirm: true,
      });

      if (updateError) {
        console.error("❌ Error updating user:", updateError.message);
        process.exit(1);
      }

      console.log(`✅ Updated password for existing user ${adminEmail}`);
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log("➕ Creating new user...");
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        email_confirm: true, // Auto-confirm email so no verification needed
        user_metadata: {
          full_name: "Administrator",
          role: "admin",
        },
      });

      if (createError) {
        console.error("❌ Error creating user:", createError.message);
        process.exit(1);
      }

      console.log(`✅ Created Administrator user in Supabase Auth`);
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`\n🎉 You can now login at /admin/login`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

createAdminUser()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
