// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createClient } from "@supabase/supabase-js";

// Load .env file from project root
config({ path: resolve(process.cwd(), ".env") });

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable is not set!");
  console.error("   Please ensure your .env file contains DATABASE_URL");
  process.exit(1);
}

// Create database connection after env vars are loaded
// Ensure connectionString is a string
const connectionString = String(process.env.DATABASE_URL).trim();
if (!connectionString) {
  console.error("❌ Error: DATABASE_URL is empty!");
  process.exit(1);
}

// Try to parse the connection string to ensure it's valid
try {
  const url = new URL(connectionString);
  // If we get here, the URL is valid
} catch (e) {
  console.error("❌ Error: DATABASE_URL is not a valid URL!");
  console.error("   Connection string format should be: postgresql://user:password@host:port/database");
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  // Add connection timeout to help debug connection issues
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool);

import { profiles, staff, issues, issueMedia, issueFeedback, announcements, notifications, issueAssignments, supportRequests, duns, zones, households, householdMembers, householdIncome, aidDistributions, roles, roleAssignments, permissions, staffPermissions } from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Check if tables exist first
    const tablesExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ) as exists
    `);
    
    if (!tablesExist.rows[0]?.exists) {
      console.error("❌ Error: Database tables don't exist!");
      console.error("   Please run migrations first: npm run drizzle:migrate");
      process.exit(1);
    }

    // Clear existing data (in reverse order of dependencies)
    // Use DELETE instead of TRUNCATE for better compatibility with Supabase
    console.log("🧹 Clearing existing data...");
    await db.execute(sql`DELETE FROM aid_distributions`);
    await db.execute(sql`DELETE FROM household_income`);
    await db.execute(sql`DELETE FROM household_members`);
    await db.execute(sql`DELETE FROM households`);
    await db.execute(sql`DELETE FROM staff_permissions`);
    await db.execute(sql`DELETE FROM role_assignments`);
    await db.execute(sql`DELETE FROM zones`);
    await db.execute(sql`DELETE FROM duns`);
    await db.execute(sql`DELETE FROM issue_assignments`);
    await db.execute(sql`DELETE FROM issue_feedback`);
    await db.execute(sql`DELETE FROM issue_media`);
    await db.execute(sql`DELETE FROM notifications`);
    await db.execute(sql`DELETE FROM issues`);
    await db.execute(sql`DELETE FROM support_requests`);
    await db.execute(sql`DELETE FROM announcements`);
    await db.execute(sql`DELETE FROM profiles`);
    await db.execute(sql`DELETE FROM staff`);
    // Note: roles and permissions are not deleted as they are seeded by migration

    // 1. Insert Profiles
    console.log("👥 Inserting profiles...");
    const insertedProfiles = await db.insert(profiles).values([
      {
        fullName: "Amelia Tan",
        email: "amelia.tan@example.com",
        phone: "+60 12-345 6789",
        address: "123 Jalan Inanam, N.18 Inanam",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDYWyAzvZ-wTVEUM6E8b3eO9urEFiuvN8jNkmtLy4BCt1aVv064lWeDffuDjvZriNWbJgmBAVaMvIPesuvcprXjtHUf0XTzK8ZxPixPDfOBPKS1gQxQb_DMs8n4NzpqzfOz6aMCIQ50cTfH6L64TGMQUs4lx7Rr9QrBpOmvxMGbsD6a4sTXZqpbKQIUeTI925ONU23HJwzMKgbvzcIB6cy17WCTx5lZWHmrJnTlpLXK76uvydgLITrwBy5fkyfn5001FRSmdYLs5M",
      },
      {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+60 12-345 6789",
        address: "456 Jalan Inanam, N.18 Inanam",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAb-eIawPtC5Og3JJtMbEPozMMIsQbzzTkpZPcTAURowGnT1ihVAtAPL_lXehKSq4WyL1KC1F9KhA_nXirCUXXqJUZjO0tXCuk1tXnRK8S2hKaDPTuqZQSbXl81XWEnz-O1zhB2gz4GQiMtqkkDul_7qJJnla5fPvQNtFRnHh0DHB2mQw8gHIpke51RfMwfLVZb6uhlCXczgR6MDmf7bereyrXm4pD56hRvslv8HmoXEixJd9EhePN1clVLqUD_TX6y9CaeZl3Zetg",
      },
      {
        fullName: "Ahmad bin Abdullah",
        email: "ahmad.abdullah@example.com",
        phone: "+60 13-456 7890",
        address: "789 Jalan Inanam, N.18 Inanam",
      },
      {
        fullName: "Sarah Lim",
        email: "sarah.lim@example.com",
        phone: "+60 14-567 8901",
        address: "321 Jalan Inanam, N.18 Inanam",
      },
      {
        fullName: "Raj Kumar",
        email: "raj.kumar@example.com",
        phone: "+60 15-678 9012",
        address: "654 Jalan Inanam, N.18 Inanam",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedProfiles.length} profiles`);

    // 2. Insert DUNs (must be before zones)
    console.log("🏛️  Inserting DUNs...");
    const insertedDuns = await db.insert(duns).values([
      {
        name: "N.18 Inanam",
        code: "N18",
        description: "Dewan Undangan Negeri for Inanam constituency",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedDuns.length} DUN(s)`);

    // 3. Create Administrator user in Supabase Auth (if service role key is available)
    console.log("🔐 Creating Administrator user in Supabase Auth...");
    const adminEmail = "administrator@n18inanam.gov.my";
    const adminPassword = "123456";
    
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
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === adminEmail.toLowerCase()
        );

        if (existingUser) {
          console.log(`   ⚠️  User ${adminEmail} already exists in Supabase Auth, skipping creation`);
          // Update password if needed
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: adminPassword,
            email_confirm: true, // Auto-confirm email
          });
          console.log(`   ✅ Updated password for existing user ${adminEmail}`);
        } else {
          // Create new user
          const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail.toLowerCase(),
            password: adminPassword,
            email_confirm: true, // Auto-confirm email so no verification needed
            user_metadata: {
              full_name: "Administrator",
              role: "admin",
            },
          });

          if (authError) {
            console.error(`   ⚠️  Failed to create user in Supabase Auth: ${authError.message}`);
            console.error(`   ⚠️  You may need to create the user manually in Supabase Dashboard`);
          } else {
            console.log(`   ✅ Created Administrator user in Supabase Auth: ${adminEmail}`);
            console.log(`   📧 Email: ${adminEmail}`);
            console.log(`   🔑 Password: ${adminPassword}`);
          }
        }
      } catch (error) {
        console.error(`   ⚠️  Error creating user in Supabase Auth:`, error);
        console.error(`   ⚠️  Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env file`);
        console.error(`   ⚠️  You may need to create the user manually in Supabase Dashboard`);
      }
    } else {
      console.log(`   ⚠️  SUPABASE_SERVICE_ROLE_KEY not found, skipping Supabase Auth user creation`);
      console.log(`   ⚠️  To create the user automatically, add SUPABASE_SERVICE_ROLE_KEY to your .env file`);
      console.log(`   ⚠️  You can create the user manually in Supabase Dashboard with:`);
      console.log(`      Email: ${adminEmail}`);
      console.log(`      Password: ${adminPassword}`);
    }

    // 4. Insert Staff (before zones, as zone leaders need zone references)
    // We'll update zone leaders after zones are created
    console.log("👔 Inserting staff...");
    const insertedStaff = await db.insert(staff).values([
      {
        name: "Y.B. Datuk Seri Panglima Haji Mohd Shafie Apdal",
        email: "adun@n18inanam.gov.my",
        phone: "+60 88-123 4567",
        role: "adun",
        position: "ADUN N.18 Inanam",
        status: "active",
      },
      {
        name: "Ahmad bin Ismail",
        email: "superadmin@n18inanam.gov.my",
        phone: "+60 88-123 4566",
        role: "super_admin",
        position: "Super Administrator",
        status: "active",
      },
      {
        name: "Administrator",
        email: adminEmail,
        phone: "+60 88-123 4999",
        role: "super_admin",
        position: "Administrator",
        status: "active",
      },
      {
        name: "Lim Wei Ming",
        email: "lim.weiming@n18inanam.gov.my",
        phone: "+60 88-123 4568",
        role: "staff_manager",
        position: "Staff Manager",
        status: "active",
      },
      {
        name: "Fatimah binti Hassan",
        email: "fatimah.hassan@n18inanam.gov.my",
        phone: "+60 88-123 4569",
        role: "staff",
        position: "Community Relations Officer",
        status: "active",
      },
      {
        name: "Tan Chee Keong",
        email: "tan.cheekeong@n18inanam.gov.my",
        phone: "+60 88-123 4570",
        role: "staff",
        position: "Field Officer",
        status: "active",
      },
      {
        name: "Norazila binti Ahmad",
        email: "norazila.ahmad@n18inanam.gov.my",
        phone: "+60 88-123 4571",
        role: "staff",
        position: "Administrative Assistant",
        status: "active",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedStaff.length} staff members`);

    // 5. Insert Issues
    console.log("📋 Inserting issues...");
    const insertedIssues = await db.insert(issues).values([
      {
        reporterId: insertedProfiles[0].id,
        title: "Pothole on Jalan Inanam near Community Hall",
        description: "There is a large pothole on Jalan Inanam, approximately 50 meters from the community hall. It's causing damage to vehicles and is a safety hazard, especially during rainy weather.",
        category: "road_maintenance",
        status: "pending",
        address: "Jalan Inanam, near Community Hall, N.18 Inanam",
        lat: 6.0333,
        lng: 116.1167,
      },
      {
        reporterId: insertedProfiles[1].id,
        title: "Blocked Drainage System on Jalan Inanam 2",
        description: "The drainage system on Jalan Inanam 2 has been blocked for the past week. Water is accumulating during rain and causing flooding on the road.",
        category: "drainage",
        status: "in_progress",
        address: "Jalan Inanam 2, N.18 Inanam",
        lat: 6.0340,
        lng: 116.1170,
      },
      {
        reporterId: insertedProfiles[2].id,
        title: "Broken Street Light at Taman Inanam",
        description: "Street light number 15 at Taman Inanam has been broken for 2 weeks. The area is very dark at night, posing a safety risk for residents.",
        category: "public_safety",
        status: "resolved",
        address: "Taman Inanam, N.18 Inanam",
        lat: 6.0350,
        lng: 116.1180,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        reporterId: insertedProfiles[0].id,
        title: "Garbage Collection Point Overflowing",
        description: "The garbage collection point at Block A is overflowing. Garbage bags are piling up and creating an unpleasant smell. This has been ongoing for 3 days.",
        category: "sanitation",
        status: "pending",
        address: "Block A, Jalan Inanam, N.18 Inanam",
        lat: 6.0320,
        lng: 116.1150,
      },
      {
        reporterId: insertedProfiles[3].id,
        title: "Damaged Playground Equipment",
        description: "The swing set at the community playground has a broken chain. One of the swings is hanging dangerously and needs immediate repair to prevent accidents.",
        category: "other",
        status: "in_progress",
        address: "Community Playground, N.18 Inanam",
        lat: 6.0360,
        lng: 116.1190,
      },
      {
        reporterId: insertedProfiles[4].id,
        title: "Cracked Sidewalk on Main Road",
        description: "There is a large crack in the sidewalk along the main road. It's becoming a tripping hazard, especially for elderly residents.",
        category: "road_maintenance",
        status: "closed",
        address: "Main Road, N.18 Inanam",
        lat: 6.0370,
        lng: 116.1200,
        resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedIssues.length} issues`);

    // 6. Insert Issue Media
    console.log("📸 Inserting issue media...");
    await db.insert(issueMedia).values([
      {
        issueId: insertedIssues[0].id,
        url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
        type: "image",
        sizeBytes: 245760,
      },
      {
        issueId: insertedIssues[0].id,
        url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
        type: "image",
        sizeBytes: 198432,
      },
      {
        issueId: insertedIssues[1].id,
        url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800",
        type: "image",
        sizeBytes: 312456,
      },
      {
        issueId: insertedIssues[2].id,
        url: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800",
        type: "image",
        sizeBytes: 187654,
      },
      {
        issueId: insertedIssues[3].id,
        url: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800",
        type: "image",
        sizeBytes: 298765,
      },
    ]);

    console.log("✅ Inserted issue media");

    // 7. Insert Issue Feedback/Comments
    console.log("💬 Inserting issue feedback...");
    await db.insert(issueFeedback).values([
      {
        issueId: insertedIssues[1].id,
        profileId: insertedProfiles[0].id,
        rating: 0,
        comments: "Thank you for reporting this. We are aware of the issue and working on it.",
      },
      {
        issueId: insertedIssues[2].id,
        profileId: insertedProfiles[2].id,
        rating: 5,
        comments: "The street light has been fixed. Thank you for the quick response!",
      },
      {
        issueId: insertedIssues[0].id,
        profileId: insertedProfiles[1].id,
        rating: 0,
        comments: "I've also noticed this pothole. It's getting worse with each rain.",
      },
      {
        issueId: insertedIssues[4].id,
        profileId: insertedProfiles[3].id,
        rating: 0,
        comments: "[ACTIVITY:status_change] Status changed from Pending to In Progress",
      },
    ]);

    console.log("✅ Inserted issue feedback");

    // 8. Insert Issue Assignments
    console.log("📌 Inserting issue assignments...");
    await db.insert(issueAssignments).values([
      {
        issueId: insertedIssues[1].id,
        staffId: insertedStaff[2].id,
        status: "assigned",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        issueId: insertedIssues[4].id,
        staffId: insertedStaff[3].id,
        status: "assigned",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        issueId: insertedIssues[2].id,
        staffId: insertedStaff[2].id,
        status: "completed",
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]);

    console.log("✅ Inserted issue assignments");

    // 9. Insert Announcements
    console.log("📢 Inserting announcements...");
    await db.insert(announcements).values([
      {
        title: "Community Hall Maintenance",
        content: "The community hall will be closed for maintenance from August 1st to August 5th. We apologize for any inconvenience caused. Alternative venues for community activities will be arranged.",
        category: "general",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      },
      {
        title: "Upcoming Town Hall Meeting",
        content: "Join us for the quarterly town hall meeting on July 28th at 7 PM to discuss upcoming community projects and address resident concerns. Your participation is important!",
        category: "general",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
      {
        title: "Road Closure Notice - Jalan Inanam 3",
        content: "Jalan Inanam 3 will be closed for road resurfacing work from July 25th to July 27th, 8 AM to 6 PM daily. Please use alternative routes during this period.",
        category: "general",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: "New Community Garden Initiative",
        content: "We're launching a new community garden initiative! Residents interested in participating can register at the community center. Free seeds and gardening tools will be provided.",
        category: "general",
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ]);

    console.log("✅ Inserted announcements");

    // 10. Insert Notifications
    console.log("🔔 Inserting notifications...");
    await db.insert(notifications).values([
      {
        profileId: insertedProfiles[0].id,
        title: "Your issue has been received",
        body: "We have received your report about 'Pothole on Jalan Inanam near Community Hall'. Our team will review it shortly.",
        category: "system",
        read: false,
      },
      {
        profileId: insertedProfiles[1].id,
        title: "Issue status updated",
        body: "Your issue 'Blocked Drainage System on Jalan Inanam 2' is now in progress.",
        category: "system",
        read: true,
      },
      {
        profileId: insertedProfiles[2].id,
        title: "Issue resolved",
        body: "Your issue 'Broken Street Light at Taman Inanam' has been resolved. Thank you for reporting!",
        category: "system",
        read: false,
      },
      {
        profileId: insertedProfiles[0].id,
        title: "New announcement",
        body: "Community Hall Maintenance - The community hall will be closed for maintenance from August 1st to August 5th.",
        category: "announcement",
        read: false,
      },
      {
        profileId: insertedProfiles[3].id,
        title: "Your issue has been received",
        body: "We have received your report about 'Damaged Playground Equipment'. Our team will review it shortly.",
        category: "system",
        read: false,
      },
    ]);

    console.log("✅ Inserted notifications");

    // 11. Insert Support Requests
    console.log("📧 Inserting support requests...");
    await db.insert(supportRequests).values([
      {
        name: "Robert Tan",
        email: "robert.tan@example.com",
        subject: "Question about community services",
        message: "I would like to know more about the community services available in N.18 Inanam. Can someone provide me with more information?",
        status: "open",
      },
      {
        name: "Lisa Wong",
        email: "lisa.wong@example.com",
        subject: "Request for community event",
        message: "I would like to organize a community event for the upcoming National Day celebration. How can I get approval and support?",
        status: "open",
      },
      {
        name: "David Chen",
        email: "david.chen@example.com",
        subject: "Complaint about noise",
        message: "There has been excessive noise from construction work near my residence. The work continues late into the night. Can something be done about this?",
        status: "open",
      },
      {
        name: "Maria Abdullah",
        email: "maria.abdullah@example.com",
        subject: "Thank you for quick response",
        message: "I would like to thank the team for the quick response to my issue report. The problem was resolved within 2 days!",
        status: "closed",
        respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ]);

    console.log("✅ Inserted support requests");

    // 12. Insert Zones (linked to DUN)
    console.log("🗺️  Inserting zones...");
    const insertedZones = await db.insert(zones).values([
      {
        dunId: insertedDuns[0].id,
        name: "Zone A",
        description: "Northern area of N.18 Inanam",
      },
      {
        dunId: insertedDuns[0].id,
        name: "Zone B",
        description: "Central area of N.18 Inanam",
      },
      {
        dunId: insertedDuns[0].id,
        name: "Zone C",
        description: "Southern area of N.18 Inanam",
      },
      {
        dunId: insertedDuns[0].id,
        name: "Zone D",
        description: "Eastern area of N.18 Inanam",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedZones.length} zones`);

    // 12b. Insert Zone Leaders (assigned to their zones)
    console.log("👥 Inserting zone leaders...");
    const zoneLeaders = await db.insert(staff).values([
      {
        name: "Hassan bin Ali",
        email: "zonea.leader@n18inanam.gov.my",
        phone: "+60 88-123 4572",
        role: "zone_leader",
        position: "Zone A Leader",
        zoneId: insertedZones[0].id,
        status: "active",
      },
      {
        name: "Siti Nurhaliza",
        email: "zoneb.leader@n18inanam.gov.my",
        phone: "+60 88-123 4573",
        role: "zone_leader",
        position: "Zone B Leader",
        zoneId: insertedZones[1].id,
        status: "active",
      },
      {
        name: "Tan Ah Beng",
        email: "zonec.leader@n18inanam.gov.my",
        phone: "+60 88-123 4574",
        role: "zone_leader",
        position: "Zone C Leader",
        zoneId: insertedZones[2].id,
        status: "active",
      },
      {
        name: "Lee Mei Ling",
        email: "zoned.leader@n18inanam.gov.my",
        phone: "+60 88-123 4575",
        role: "zone_leader",
        position: "Zone D Leader",
        zoneId: insertedZones[3].id,
        status: "active",
      },
    ]).returning();

    console.log(`✅ Inserted ${zoneLeaders.length} zone leaders`);

    // 12c. Insert Role Assignments (ADUN appoints people to roles in zones)
    console.log("👔 Inserting role assignments...");
    
    let insertedRoleAssignmentsCount = 0;
    
    // Get roles (they should exist from migration)
    const existingRoles = await db.select().from(roles);
    
    // Find Ketua Cawangan and Ketua Kampung roles
    const ketuaCawanganRole = existingRoles.find(r => r.name === "Ketua Cawangan");
    const ketuaKampungRole = existingRoles.find(r => r.name === "Ketua Kampung");
    
    if (ketuaCawanganRole && ketuaKampungRole) {
      // ADUN appoints staff to roles in different zones
      // Ketua Cawangan handles aids and household registration
      // Ketua Kampung handles divorce, conflict, and community issues
      
      const roleAssignmentsData = [];
      
      // Assign Ketua Cawangan to Zone A (for aids and household registration)
      if (insertedStaff.length > 3) {
        roleAssignmentsData.push({
          staffId: insertedStaff[3].id, // Fatimah binti Hassan
          roleId: ketuaCawanganRole.id,
          zoneId: insertedZones[0].id, // Zone A
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle aids distribution and household registration for Zone A",
        });
      }
      
      // Assign Ketua Kampung to Zone A (for divorce, conflict, community issues)
      if (insertedStaff.length > 4) {
        roleAssignmentsData.push({
          staffId: insertedStaff[4].id, // Tan Chee Keong
          roleId: ketuaKampungRole.id,
          zoneId: insertedZones[0].id, // Zone A
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle divorce, conflict, and community issues for Zone A",
        });
      }
      
      // Assign Ketua Cawangan to Zone B
      if (insertedStaff.length > 5) {
        roleAssignmentsData.push({
          staffId: insertedStaff[5].id, // Norazila binti Ahmad
          roleId: ketuaCawanganRole.id,
          zoneId: insertedZones[1].id, // Zone B
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle aids distribution and household registration for Zone B",
        });
      }
      
      // Assign Ketua Kampung to Zone B (using a zone leader)
      if (zoneLeaders.length > 1) {
        roleAssignmentsData.push({
          staffId: zoneLeaders[1].id, // Siti Nurhaliza (Zone B Leader)
          roleId: ketuaKampungRole.id,
          zoneId: insertedZones[1].id, // Zone B
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle divorce, conflict, and community issues for Zone B",
        });
      }
      
      // Assign Ketua Cawangan to Zone C
      if (insertedStaff.length > 2) {
        roleAssignmentsData.push({
          staffId: insertedStaff[2].id, // Lim Wei Ming (Staff Manager)
          roleId: ketuaCawanganRole.id,
          zoneId: insertedZones[2].id, // Zone C
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle aids distribution and household registration for Zone C",
        });
      }
      
      // Assign Ketua Kampung to Zone C
      if (zoneLeaders.length > 2) {
        roleAssignmentsData.push({
          staffId: zoneLeaders[2].id, // Tan Ah Beng (Zone C Leader)
          roleId: ketuaKampungRole.id,
          zoneId: insertedZones[2].id, // Zone C
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN to handle divorce, conflict, and community issues for Zone C",
        });
      }
      
      if (roleAssignmentsData.length > 0) {
        const insertedRoleAssignments = await db.insert(roleAssignments).values(roleAssignmentsData).returning();
        insertedRoleAssignmentsCount = insertedRoleAssignments.length;
        console.log(`✅ Inserted ${insertedRoleAssignmentsCount} role assignments`);
      } else {
        console.log("⚠️  No role assignments created (roles or staff not found)");
      }
    } else {
      console.log("⚠️  Roles not found. Please ensure migration 0007 has been run.");
    }

    // 13. Insert Households
    console.log("🏠 Inserting households...");
    const insertedHouseholds = await db.insert(households).values([
      {
        headOfHouseholdId: insertedProfiles[0].id,
        headName: "Amelia Tan",
        headIcNumber: "850101-10-1234",
        headPhone: "+60 12-345 6789",
        address: "123 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[0].id, // Zone A
        area: "Zone A",
        notes: "Elderly household, requires regular assistance",
      },
      {
        headOfHouseholdId: insertedProfiles[1].id,
        headName: "Jane Doe",
        headIcNumber: "870305-08-5678",
        headPhone: "+60 12-345 6789",
        address: "456 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[1].id, // Zone B
        area: "Zone B",
        notes: "Single parent household",
      },
      {
        headOfHouseholdId: insertedProfiles[2].id,
        headName: "Ahmad bin Abdullah",
        headIcNumber: "820715-12-9012",
        headPhone: "+60 13-456 7890",
        address: "789 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[0].id, // Zone A
        area: "Zone A",
      },
      {
        headOfHouseholdId: insertedProfiles[3].id,
        headName: "Sarah Lim",
        headIcNumber: "880920-14-3456",
        headPhone: "+60 14-567 8901",
        address: "321 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[2].id, // Zone C
        area: "Zone C",
        notes: "Large family with multiple dependents",
      },
      {
        headName: "Mohd Razak bin Hassan",
        headIcNumber: "750312-10-7890",
        headPhone: "+60 16-789 0123",
        address: "111 Taman Inanam, N.18 Inanam",
        zoneId: insertedZones[1].id, // Zone B
        area: "Zone B",
        notes: "No profile linked",
      },
      {
        headName: "Lee Mei Ling",
        headIcNumber: "900425-08-2345",
        headPhone: "+60 17-890 1234",
        address: "222 Jalan Inanam 2, N.18 Inanam",
        zoneId: insertedZones[0].id, // Zone A
        area: "Zone A",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedHouseholds.length} households`);

    // 14. Insert Household Members
    console.log("👨‍👩‍👧‍👦 Inserting household members...");
    const insertedMembers = await db.insert(householdMembers).values([
      // Household 1 - Amelia Tan (elderly couple)
      {
        householdId: insertedHouseholds[0].id,
        name: "Amelia Tan",
        icNumber: "850101-10-1234",
        relationship: "head",
        dateOfBirth: new Date("1985-01-01"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[0].id,
        name: "Tan Ah Beng",
        icNumber: "840205-10-5678",
        relationship: "spouse",
        dateOfBirth: new Date("1984-02-05"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[0].id,
        name: "Tan Mei Li",
        icNumber: "120315-10-9012",
        relationship: "child",
        dateOfBirth: new Date("2012-03-15"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      // Household 2 - Jane Doe (single parent)
      {
        householdId: insertedHouseholds[1].id,
        name: "Jane Doe",
        icNumber: "870305-08-5678",
        relationship: "head",
        dateOfBirth: new Date("1987-03-05"),
        locality: "Sekolah Menengah Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[1].id,
        name: "Doe John",
        icNumber: "150620-08-3456",
        relationship: "child",
        dateOfBirth: new Date("2015-06-20"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      {
        householdId: insertedHouseholds[1].id,
        name: "Doe Sarah",
        icNumber: "180425-08-7890",
        relationship: "child",
        dateOfBirth: new Date("2018-04-25"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      // Household 3 - Ahmad bin Abdullah
      {
        householdId: insertedHouseholds[2].id,
        name: "Ahmad bin Abdullah",
        icNumber: "820715-12-9012",
        relationship: "head",
        dateOfBirth: new Date("1982-07-15"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[2].id,
        name: "Siti Nurhaliza binti Ahmad",
        icNumber: "850920-12-2345",
        relationship: "spouse",
        dateOfBirth: new Date("1985-09-20"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[2].id,
        name: "Ahmad Firdaus",
        icNumber: "100815-12-5678",
        relationship: "child",
        dateOfBirth: new Date("2010-08-15"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      {
        householdId: insertedHouseholds[2].id,
        name: "Ahmad Fadzli",
        icNumber: "130520-12-9012",
        relationship: "child",
        dateOfBirth: new Date("2013-05-20"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      {
        householdId: insertedHouseholds[2].id,
        name: "Ahmad Farid",
        icNumber: "160310-12-3456",
        relationship: "child",
        dateOfBirth: new Date("2016-03-10"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      // Household 4 - Sarah Lim (large family)
      {
        householdId: insertedHouseholds[3].id,
        name: "Sarah Lim",
        icNumber: "880920-14-3456",
        relationship: "head",
        dateOfBirth: new Date("1988-09-20"),
        locality: "Sekolah Menengah Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[3].id,
        name: "Lim Wei Ming",
        icNumber: "860415-14-7890",
        relationship: "spouse",
        dateOfBirth: new Date("1986-04-15"),
        locality: "Sekolah Menengah Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[3].id,
        name: "Lim Jia Hui",
        icNumber: "110625-14-1234",
        relationship: "child",
        dateOfBirth: new Date("2011-06-25"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      {
        householdId: insertedHouseholds[3].id,
        name: "Lim Jia Wei",
        icNumber: "140815-14-5678",
        relationship: "child",
        dateOfBirth: new Date("2014-08-15"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
      {
        householdId: insertedHouseholds[3].id,
        name: "Lim Ah Ma",
        icNumber: "550210-14-9012",
        relationship: "parent",
        dateOfBirth: new Date("1955-02-10"),
        locality: "Sekolah Menengah Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "dependent",
      },
      // Household 5 - Mohd Razak
      {
        householdId: insertedHouseholds[4].id,
        name: "Mohd Razak bin Hassan",
        icNumber: "750312-10-7890",
        relationship: "head",
        dateOfBirth: new Date("1975-03-12"),
        locality: "Dewan Komuniti Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[4].id,
        name: "Hassan binti Razak",
        icNumber: "780625-10-2345",
        relationship: "spouse",
        dateOfBirth: new Date("1978-06-25"),
        locality: "Dewan Komuniti Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      // Household 6 - Lee Mei Ling
      {
        householdId: insertedHouseholds[5].id,
        name: "Lee Mei Ling",
        icNumber: "900425-08-2345",
        relationship: "head",
        dateOfBirth: new Date("1990-04-25"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "at_home",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[5].id,
        name: "Lee Wei Jie",
        icNumber: "920815-08-5678",
        relationship: "spouse",
        dateOfBirth: new Date("1992-08-15"),
        locality: "Sekolah Kebangsaan Inanam", // Eligible voter
        status: "away",
        dependencyStatus: "independent",
      },
      {
        householdId: insertedHouseholds[5].id,
        name: "Lee Xin Yi",
        icNumber: "190315-08-9012",
        relationship: "child",
        dateOfBirth: new Date("2019-03-15"),
        status: "at_home",
        dependencyStatus: "dependent",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedMembers.length} household members`);

    // 15. Insert Household Income
    console.log("💰 Inserting household income records...");
    await db.insert(householdIncome).values([
      {
        householdId: insertedHouseholds[0].id,
        monthlyIncome: 2500.00,
        incomeSource: "Pension, Part-time work",
        numberOfIncomeEarners: 1,
        notes: "Elderly couple, limited income",
      },
      {
        householdId: insertedHouseholds[1].id,
        monthlyIncome: 1800.00,
        incomeSource: "Employment",
        numberOfIncomeEarners: 1,
        notes: "Single parent, working full-time",
      },
      {
        householdId: insertedHouseholds[2].id,
        monthlyIncome: 4500.00,
        incomeSource: "Employment, Business",
        numberOfIncomeEarners: 2,
      },
      {
        householdId: insertedHouseholds[3].id,
        monthlyIncome: 3200.00,
        incomeSource: "Employment",
        numberOfIncomeEarners: 2,
        notes: "Large family, both parents working",
      },
      {
        householdId: insertedHouseholds[4].id,
        monthlyIncome: 1200.00,
        incomeSource: "Government Aid, Odd jobs",
        numberOfIncomeEarners: 1,
        notes: "Low income household",
      },
      {
        householdId: insertedHouseholds[5].id,
        monthlyIncome: 3800.00,
        incomeSource: "Employment",
        numberOfIncomeEarners: 1,
        notes: "One spouse working, other away",
      },
    ]);

    console.log("✅ Inserted household income records");

    // 16. Insert Aid Distributions
    console.log("📦 Inserting aid distributions...");
    await db.insert(aidDistributions).values([
      {
        householdId: insertedHouseholds[0].id,
        aidType: "Food Basket",
        quantity: 1,
        distributedTo: 3,
        distributedBy: insertedStaff[2].id,
        distributionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        notes: "Monthly food aid for elderly household",
      },
      {
        householdId: insertedHouseholds[1].id,
        aidType: "Food Basket",
        quantity: 1,
        distributedTo: 3,
        distributedBy: insertedStaff[3].id,
        distributionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        notes: "Single parent household support",
      },
      {
        householdId: insertedHouseholds[2].id,
        aidType: "Cash Aid",
        quantity: 1,
        distributedTo: 5,
        distributedBy: insertedStaff[2].id,
        distributionDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        notes: "One-time cash assistance",
      },
      {
        householdId: insertedHouseholds[3].id,
        aidType: "Food Basket",
        quantity: 2,
        distributedTo: 5,
        distributedBy: insertedStaff[3].id,
        distributionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        notes: "Large family, extra quantity",
      },
      {
        householdId: insertedHouseholds[4].id,
        aidType: "Food Basket",
        quantity: 1,
        distributedTo: 2,
        distributedBy: insertedStaff[2].id,
        distributionDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        notes: "Low income household support",
      },
      {
        householdId: insertedHouseholds[4].id,
        aidType: "Medical Supplies",
        quantity: 1,
        distributedTo: 2,
        distributedBy: insertedStaff[4].id,
        distributionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        notes: "Basic medical supplies",
      },
      {
        householdId: insertedHouseholds[0].id,
        aidType: "Cash Aid",
        quantity: 1,
        distributedTo: 3,
        distributedBy: insertedStaff[2].id,
        distributionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        notes: "Monthly cash assistance",
      },
    ]);

    console.log("✅ Inserted aid distributions");

    // 13. Seed Permissions (if they don't exist)
    console.log("🔐 Seeding permissions...");
    const existingPermissions = await db.select().from(permissions);
    
    if (existingPermissions.length === 0) {
      // Insert default permissions
      const defaultPermissions = [
        {
          code: "register_household",
          name: "Register Household",
          description: "Allows staff to register new households in their assigned zones",
          category: "households",
        },
        {
          code: "update_household",
          name: "Update Household",
          description: "Allows staff to update household information",
          category: "households",
        },
        {
          code: "delete_household",
          name: "Delete Household",
          description: "Allows staff to delete households",
          category: "households",
        },
        {
          code: "manage_staff",
          name: "Manage Staff",
          description: "Allows staff to create, update, and delete staff members",
          category: "staff",
        },
        {
          code: "manage_zones",
          name: "Manage Zones",
          description: "Allows staff to create, update, and delete zones",
          category: "zones",
        },
        {
          code: "manage_roles",
          name: "Manage Roles",
          description: "Allows staff to create, update, and delete organizational roles",
          category: "roles",
        },
        {
          code: "assign_roles",
          name: "Assign Roles",
          description: "Allows staff to assign organizational roles to other staff",
          category: "roles",
        },
        {
          code: "manage_permissions",
          name: "Manage Permissions",
          description: "Allows staff to grant and revoke permissions",
          category: "permissions",
        },
        {
          code: "distribute_aid",
          name: "Distribute Aid",
          description: "Allows staff to record aid distributions",
          category: "households",
        },
        {
          code: "view_all_zones",
          name: "View All Zones",
          description: "Allows staff to view all zones regardless of assignment",
          category: "zones",
        },
      ];

      const insertedPermissions = await db.insert(permissions).values(defaultPermissions).returning();
      console.log(`✅ Inserted ${insertedPermissions.length} permissions`);
    } else {
      console.log(`✅ Permissions already exist (${existingPermissions.length} found)`);
    }

    // 14. Grant example permissions to staff members
    console.log("🔐 Granting permissions to staff...");
    
    // Get permissions
    const allPermissions = await db.select().from(permissions);
    const registerHouseholdPerm = allPermissions.find(p => p.code === "register_household");
    const distributeAidPerm = allPermissions.find(p => p.code === "distribute_aid");
    const updateHouseholdPerm = allPermissions.find(p => p.code === "update_household");

    const permissionGrants = [];

    if (registerHouseholdPerm && insertedStaff.length > 3) {
      // Grant register_household permission to a staff member (not zone leader)
      permissionGrants.push({
        staffId: insertedStaff[3].id, // Fatimah binti Hassan
        permissionId: registerHouseholdPerm.id,
        grantedBy: insertedStaff[0].id, // ADUN
        notes: "Granted permission to register households",
      });
    }

    if (distributeAidPerm && insertedStaff.length > 4) {
      // Grant distribute_aid permission to another staff member
      permissionGrants.push({
        staffId: insertedStaff[4].id, // Tan Chee Keong
        permissionId: distributeAidPerm.id,
        grantedBy: insertedStaff[0].id, // ADUN
        notes: "Granted permission to distribute aid",
      });
    }

    if (updateHouseholdPerm && insertedStaff.length > 5) {
      // Grant update_household permission to another staff member
      permissionGrants.push({
        staffId: insertedStaff[5].id, // Norazila binti Ahmad
        permissionId: updateHouseholdPerm.id,
        grantedBy: insertedStaff[0].id, // ADUN
        notes: "Granted permission to update household information",
      });
    }

    if (permissionGrants.length > 0) {
      await db.insert(staffPermissions).values(permissionGrants);
      console.log(`✅ Granted ${permissionGrants.length} permissions to staff members`);
    } else {
      console.log("⚠️  No permissions granted (permissions or staff not found)");
    }

    console.log("\n✨ Database seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${insertedProfiles.length} profiles`);
    console.log(`   - ${insertedDuns.length} DUN(s)`);
    console.log(`   - ${insertedStaff.length + zoneLeaders.length} staff members (${insertedStaff.length} regular + ${zoneLeaders.length} zone leaders)`);
    console.log(`   - ${insertedIssues.length} issues`);
    console.log("   - 5 issue media items");
    console.log("   - 4 issue feedback entries");
    console.log("   - 3 issue assignments");
    console.log("   - 4 announcements");
    console.log("   - 5 notifications");
    console.log("   - 4 support requests");
    console.log(`   - ${insertedZones.length} zones`);
    if (insertedRoleAssignmentsCount > 0) {
      console.log(`   - ${insertedRoleAssignmentsCount} role assignments`);
    }
    console.log(`   - ${insertedHouseholds.length} households`);
    console.log(`   - ${insertedMembers.length} household members`);
    console.log("   - 6 household income records");
    console.log("   - 7 aid distributions");
    const allPerms = await db.select().from(permissions);
    console.log(`   - ${allPerms.length} permissions available`);
    const grantedPerms = await db.select().from(staffPermissions);
    console.log(`   - ${grantedPerms.length} permissions granted to staff`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run seed if this file is executed directly
seed()
  .then(() => {
    console.log("\n✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  });

export default seed;
