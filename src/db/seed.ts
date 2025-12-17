/**
 * Database Seeder
 * 
 * Usage:
 *   - Seed all tables: npm run db:seed (or npm run db:seed)
 *   - Seed individual table: npm run db:seed -- --table=issue_types
 *   - Seed with clearing existing data: npm run db:seed -- --table=issue_types --clear
 * 
 * Available tables:
 *   - issue_types (or issue-types)
 *   - issue_statuses (or issue-statuses)
 *   - priorities
 *   - profiles
 *   - issues (depends on profiles and issue_types - will auto-seed dependencies if missing)
 *   - app_settings (or app-settings)
 *   - announcements
 * 
 * Examples:
 *   npm run db:seed
 *   npm run db:seed -- --table=issue_types
 *   npm run db:seed -- --table=issue_statuses
 *   npm run db:seed -- --table=priorities
 *   npm run db:seed -- --table=profiles
 *   npm run db:seed -- --table=issues
 *   npm run db:seed -- --table=announcements
 *   npm run db:seed -- --table=announcements --clear
 *   npm run db:seed -- --table=issue_types --clear
 *   npm run db:seed -- -t issues -c
 *   tsx src/db/seed.ts --table=issues
 */

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

import { profiles, staff, issues, issueMedia, issueFeedback, announcements, notifications, issueAssignments, supportRequests, duns, zones, cawangan, villages, households, householdMembers, householdIncome, aidDistributions, roles, roleAssignments, permissions, staffPermissions, appSettings, aidsPrograms, aidsProgramZones, aidsProgramAssignments, aidsDistributionRecords, issueTypes, issueStatuses, priorities } from "./schema";
import { sql } from "drizzle-orm";

// Type for seed function results
type SeedResult = {
  [key: string]: any;
};

// Registry of seed functions
const seedFunctions: Record<string, (existingData?: SeedResult) => Promise<SeedResult>> = {};

// Helper to get command line arguments
function getTableToSeed(): string | null {
  const args = process.argv.slice(2);
  const tableArg = args.find(arg => arg.startsWith('--table=') || arg.startsWith('-t='));
  if (tableArg) {
    return tableArg.split('=')[1];
  }
  // Also support --table <name> format
  const tableIndex = args.findIndex(arg => arg === '--table' || arg === '-t');
  if (tableIndex !== -1 && args[tableIndex + 1]) {
    return args[tableIndex + 1];
  }
  return null;
}

// Helper to check if we should clear data
function shouldClearData(): boolean {
  const args = process.argv.slice(2);
  return args.includes('--clear') || args.includes('-c');
}

async function seedIssueTypes(existingData?: SeedResult): Promise<SeedResult> {
  console.log("📋 Seeding issue types...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM issue_types`);
  }

  const insertedIssueTypes = await db.insert(issueTypes).values([
    {
      name: "Penyelenggaraan Jalan",
      code: "road_maintenance",
      description: "Issues related to road maintenance, potholes, and road conditions",
      isActive: true,
      displayOrder: 1,
    },
    {
      name: "Perparitan",
      code: "drainage",
      description: "Issues related to drainage systems, clogged drains, and flooding",
      isActive: true,
      displayOrder: 2,
    },
    {
      name: "Keselamatan Awam",
      code: "public_safety",
      description: "Issues related to public safety, security, and emergency situations",
      isActive: true,
      displayOrder: 3,
    },
    {
      name: "Pembersihan",
      code: "sanitation",
      description: "Issues related to waste management, cleanliness, and sanitation",
      isActive: true,
      displayOrder: 4,
    },
    {
      name: "Lain-Lain",
      code: "other",
      description: "Other types of issues not covered by the above categories",
      isActive: true,
      displayOrder: 5,
    },
  ]).returning();

  console.log(`✅ Seeded ${insertedIssueTypes.length} issue types`);
  return { issueTypes: insertedIssueTypes };
}

// Register seed function
seedFunctions['issue_types'] = seedIssueTypes;
seedFunctions['issue-types'] = seedIssueTypes; // Also support kebab-case

async function seedPriorities(existingData?: SeedResult): Promise<SeedResult> {
  console.log("🚩 Seeding priorities...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM priorities`);
  }

  const insertedPriorities = await db.insert(priorities).values([
    {
      name: "Low",
      code: "low",
      description: "Low priority issues that can be addressed in due course",
      isActive: true,
    },
    {
      name: "Medium",
      code: "medium",
      description: "Medium priority issues that require normal attention",
      isActive: true,
    },
    {
      name: "High",
      code: "high",
      description: "High priority issues that require urgent attention",
      isActive: true,
    },
    {
      name: "Critical",
      code: "critical",
      description: "Critical priority issues that require immediate action",
      isActive: true,
    },
  ]).returning();

  console.log(`✅ Seeded ${insertedPriorities.length} priorities`);
  return { priorities: insertedPriorities };
}

// Register seed function
seedFunctions['priorities'] = seedPriorities;

async function seedIssueStatuses(existingData?: SeedResult): Promise<SeedResult> {
  console.log("📊 Seeding issue statuses...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM issue_statuses`);
  }

  const insertedIssueStatuses = await db.insert(issueStatuses).values([
    {
      name: "Pending",
      code: "pending",
      description: "Issue is pending review",
      isActive: true,
      displayOrder: 1,
    },
    {
      name: "In Progress",
      code: "in_progress",
      description: "Issue is being worked on",
      isActive: true,
      displayOrder: 2,
    },
    {
      name: "Resolved",
      code: "resolved",
      description: "Issue has been resolved",
      isActive: true,
      displayOrder: 3,
    },
    {
      name: "Closed",
      code: "closed",
      description: "Issue has been closed",
      isActive: true,
      displayOrder: 4,
    },
  ]).returning();

  console.log(`✅ Seeded ${insertedIssueStatuses.length} issue statuses`);
  return { issueStatuses: insertedIssueStatuses };
}

// Register seed function
seedFunctions['issue_statuses'] = seedIssueStatuses;
seedFunctions['issue-statuses'] = seedIssueStatuses; // Also support kebab-case

async function seedProfiles(existingData?: SeedResult): Promise<SeedResult> {
  console.log("👥 Seeding profiles...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM issue_assignments`);
    await db.execute(sql`DELETE FROM issue_feedback`);
    await db.execute(sql`DELETE FROM issue_media`);
    await db.execute(sql`DELETE FROM notifications`);
    await db.execute(sql`DELETE FROM issues`);
    await db.execute(sql`DELETE FROM households`);
    await db.execute(sql`DELETE FROM profiles`);
  }

  // Get existing profiles
  const existingProfiles = await db.select().from(profiles);
  console.log(`   Found ${existingProfiles.length} existing profile(s)`);

  // Create seed profiles if we don't have enough
  let insertedProfiles: Array<{ id: number;[key: string]: any }> = [];
  if (existingProfiles.length < 5) {
    const seedProfiles = [
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
    ];

    // Only create profiles that don't already exist (check by email)
    const existingEmails = new Set(existingProfiles.map(p => p.email?.toLowerCase()).filter(Boolean));
    const profilesToCreate = seedProfiles.filter(p => !existingEmails.has(p.email.toLowerCase()));

    if (profilesToCreate.length > 0) {
      insertedProfiles = (await db.insert(profiles).values(profilesToCreate).returning()) as Array<{ id: number;[key: string]: any }>;
      console.log(`✅ Created ${insertedProfiles.length} profile(s)`);
    }
  }

  const allProfiles = [...existingProfiles, ...insertedProfiles];
  console.log(`✅ Total profiles: ${allProfiles.length}`);
  return { profiles: allProfiles };
}

seedFunctions['profiles'] = seedProfiles;

async function seedIssues(existingData?: SeedResult): Promise<SeedResult> {
  console.log("📋 Seeding issues...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM issue_assignments`);
    await db.execute(sql`DELETE FROM issue_feedback`);
    await db.execute(sql`DELETE FROM issue_media`);
    await db.execute(sql`DELETE FROM notifications`);
    await db.execute(sql`DELETE FROM issues`);
  }

  // Ensure dependencies exist
  const existingIssueTypes = await db.select().from(issueTypes);
  if (existingIssueTypes.length === 0) {
    console.log("   ⚠️  No issue types found. Seeding issue types first...");
    await seedIssueTypes();
    const refreshedIssueTypes = await db.select().from(issueTypes);
    existingIssueTypes.push(...refreshedIssueTypes);
  }

  const existingProfiles = await db.select().from(profiles);
  if (existingProfiles.length === 0) {
    console.log("   ⚠️  No profiles found. Seeding profiles first...");
    await seedProfiles();
    const refreshedProfiles = await db.select().from(profiles);
    existingProfiles.push(...refreshedProfiles);
  }

  // Helper function to find issue type by code
  const getIssueTypeId = (code: string) => {
    return existingIssueTypes.find((it: { code: string | null; id: number }) => it.code === code)?.id || null;
  };

  // Generate issues with random locations in Inanam (Postcode 88450)
  const generateIssues = () => {
    const issueTemplates = [
      // Road Maintenance (Penyelenggaraan Jalan)
      {
        category: "road_maintenance", code: "road_maintenance", titles: [
          "Lubang jalan di {location}",
          "Permukaan jalan retak di {location}",
          "Garisan jalan pudar di {location}",
          "Jalan tidak rata berhampiran {location}",
          "Hakisan jalan di {location}",
          "Papan tanda jalan hilang di {location}",
          "Bonggol jalan rosak di {location}",
          "Bahu jalan runtuh di {location}",
        ], descriptions: [
          "Terdapat lubang besar yang memerlukan perhatian segera. Kenderaan mungkin mengalami kerosakan.",
          "Permukaan jalan telah retak dan semakin teruk.",
          "Garisan jalan telah pudar dan perlu dicat semula untuk keselamatan.",
          "Permukaan jalan tidak rata, menyebabkan ketidakselesaan kepada pemandu dan kerosakan kenderaan.",
          "Hakisan jalan berlaku akibat hujan lebat, membahayakan pengguna.",
          "Papan tanda jalan hilang, menyebabkan kekeliruan kepada pemandu.",
          "Bonggol jalan rosak dan perlu dibaiki.",
          "Bahu jalan telah runtuh, menyempitkan laluan jalan.",
        ]
      },
      // Drainage (Perparitan)
      {
        category: "drainage", code: "drainage", titles: [
          "Longkang tersumbat di {location}",
          "Masalah banjir di {location}",
          "Penutup longkang pecah di {location}",
          "Air longkang melimpah berhampiran {location}",
          "Sistem perparitan tersumbat di {location}",
          "Paip longkang pecah di {location}",
          "Air bertakung di {location}",
          "Limpahan sistem perparitan di {location}",
        ], descriptions: [
          "Sistem perparitan tersumbat dan air bertakung di jalan raya.",
          "Hujan lebat menyebabkan banjir di kawasan ini akibat sistem perparitan yang lemah.",
          "Penutup longkang pecah, membahayakan pejalan kaki.",
          "Longkang melimpah dan air tumpah ke jalan raya.",
          "Sistem perparitan tersumbat sepenuhnya dan perlu dibersihkan.",
          "Paip longkang telah pecah dan perlu diganti.",
          "Air bertakung disebabkan reka bentuk perparitan yang lemah.",
          "Sistem perparitan tidak dapat menampung jumlah air semasa hujan.",
        ]
      },
      // Public Safety (Keselamatan Awam)
      {
        category: "public_safety", code: "public_safety", titles: [
          "Lampu jalan rosak di {location}",
          "Susur keselamatan hilang di {location}",
          "Lintasan pejalan kaki tidak selamat di {location}",
          "Penghalang keselamatan rosak di {location}",
          "Kawasan gelap di {location} - perlukan lampu",
          "Dahan pokok berbahaya di {location}",
          "Peralatan taman permainan tidak selamat di {location}",
          "Papan tanda keselamatan hilang di {location}",
        ], descriptions: [
          "Lampu jalan rosak, menjadikan kawasan gelap dan tidak selamat pada waktu malam.",
          "Susur keselamatan hilang, membahayakan kenderaan.",
          "Lintasan pejalan kaki kekurangan ciri keselamatan yang sewajarnya.",
          "Penghalang keselamatan rosak dan perlu dibaiki segera.",
          "Kawasan ini terlalu gelap pada waktu malam dan memerlukan pencahayaan tambahan.",
          "Dahan pokok besar tergantung secara berbahaya dan mungkin jatuh.",
          "Peralatan taman permainan rosak dan membahayakan keselamatan kanak-kanak.",
          "Papan tanda keselamatan hilang, menyebabkan kekeliruan dan potensi bahaya.",
        ]
      },
      // Sanitation (Kebersihan & Sanitasi)
      {
        category: "sanitation", code: "sanitation", titles: [
          "Tong sampah melimpah di {location}",
          "Pembuangan sampah haram di {location}",
          "Sampah tidak dipungut di {location}",
          "Tempat pengumpulan sampah rosak di {location}",
          "Bau busuk dari sampah di {location}",
          "Sampah bertaburan di {location}",
          "Bekas sampah penuh di {location}",
          "Masalah pengurusan sisa di {location}",
        ], descriptions: [
          "Tong sampah melimpah dan sampah tumpah keluar.",
          "Seseorang telah membuang sampah secara haram di kawasan ini.",
          "Sampah tidak dipungut selama beberapa hari.",
          "Tempat pengumpulan sampah rosak dan perlu dibaiki.",
          "Terdapat bau busuk yang kuat dari timbunan sampah.",
          "Sampah telah bertaburan di sekitar, menyakitkan mata memandang.",
          "Bekas sampah penuh dan perlu dipungut segera.",
          "Terdapat masalah pengurusan sisa yang memerlukan perhatian.",
        ]
      },
      // Other (Lain-lain)
      {
        category: "other", code: "other", titles: [
          "Kemudahan awam rosak di {location}",
          "Vandalisme di {location}",
          "Aduan bunyi bising di {location}",
          "Masalah kemudahan awam di {location}",
          "Masalah fasiliti komuniti di {location}",
          "Kerosakan infrastruktur di {location}",
          "Masalah ruang awam di {location}",
          "Aduan umum di {location}",
        ], descriptions: [
          "Kemudahan awam telah rosak dan perlu dibaiki.",
          "Vandalisme telah berlaku dan perlu ditangani.",
          "Terdapat bunyi bising yang melampau mengganggu penduduk.",
          "Kemudahan awam tidak berfungsi dengan baik.",
          "Terdapat masalah dengan fasiliti komuniti.",
          "Infrastruktur telah rosak dan memerlukan perhatian.",
          "Terdapat masalah dengan ruang awam.",
          "Satu aduan umum telah dikemukakan oleh penduduk.",
        ]
      },
    ];

    // List of street names in/around Inanam (Postcode 88450)
    const streetNames = [
      "Jalan Tuaran", "Jalan Kiansom", "Jalan Inanam", "Lorong Inanam Plaza",
      "Lorong Inanam Kapital", "Jalan Undan Inanam", "Lorong Perindustrian",
      "Jalan Bantayan Minintod", "Jalan Kionsom", "Lorong Kurma",
      "Lorong Manggis", "Lorong Durian", "Jalan Nountun",
      "Lorong Cempedak", "Jalan Poring", "Lorong Terap",
      "Jalan Bambangan", "Lorong Rambutan", "Lorong Langsat",
      "Jalan Sungai Inanam", "Jalan Pasar Inanam"
    ];

    const statuses: Array<"pending" | "in_progress" | "resolved" | "closed"> = ["pending", "in_progress", "resolved", "closed"];
    const issues: Array<{
      reporterId: number;
      title: string;
      description: string;
      category: "road_maintenance" | "drainage" | "public_safety" | "sanitation" | "other";
      issueTypeId: number | null;
      status: "pending" | "in_progress" | "resolved" | "closed";
      address: string;
      lat: number;
      lng: number;
      createdAt?: Date;
      resolvedAt?: Date;
    }> = [];

    // Ensure we have at least one profile
    if (existingProfiles.length === 0) {
      throw new Error("No profiles available. Cannot generate issues without reporters.");
    }

    // Inanam bounding box (Approximate for 88450)
    // Center roughly 5.9900, 116.1400
    // Min Lat: 5.9500, Max Lat: 6.0300
    // Min Lng: 116.1000, Max Lng: 116.1800
    const minLat = 5.9500;
    const maxLat = 6.0300;
    const minLng = 116.1000;
    const maxLng = 116.1800;

    // Generate 100+ issues
    for (let i = 0; i < 100; i++) {
      const template = issueTemplates[i % issueTemplates.length];
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      const locationName = streetName; // For title replacement

      const reporter = existingProfiles[i % existingProfiles.length];
      const status = statuses[i % statuses.length];
      const titleIndex = Math.floor(i / issueTemplates.length) % template.titles.length;
      const descIndex = Math.floor(i / issueTemplates.length) % template.descriptions.length;

      // Random coordinates within 88450 Inanam bounds
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);

      // Generate dates - spread over the last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      let resolvedAt: Date | undefined;
      if (status === "resolved" || status === "closed") {
        const daysToResolve = Math.floor(Math.random() * daysAgo);
        resolvedAt = new Date(Date.now() - daysToResolve * 24 * 60 * 60 * 1000);
      }

      issues.push({
        reporterId: reporter.id,
        title: template.titles[titleIndex].replace("{location}", locationName),
        description: template.descriptions[descIndex],
        category: template.category as "road_maintenance" | "drainage" | "public_safety" | "sanitation" | "other",
        issueTypeId: getIssueTypeId(template.code),
        status: status,
        address: `${streetName}, 88450 Inanam, Sabah`,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        createdAt: createdAt,
        resolvedAt: resolvedAt,
      });
    }

    return issues;
  };

  const issuesToInsert = generateIssues();
  const insertedIssues = await db.insert(issues).values(issuesToInsert).returning();

  console.log(`✅ Seeded ${insertedIssues.length} issues`);
  return { issues: insertedIssues };
}

seedFunctions['issues'] = seedIssues;

async function seedAppSettings(existingData?: SeedResult): Promise<SeedResult> {
  console.log("⚙️  Seeding app settings...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM app_settings`);
  }

  // Get staff for updatedBy field
  const existingStaff = await db.select().from(staff);
  const settingsUpdatedBy = existingStaff.length > 0 ? existingStaff[0].id : null;

  if (!settingsUpdatedBy) {
    console.log("   ⚠️  No staff found. App settings will be created without updated_by field.");
  }

  const defaultLoginImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDmv2CVtuNASMwZdMSvemNUs8M8rpPOUmfvweQGpyAeoi8ItTn569RZolM1Y1n9js1J7O4y7UbaCdnWdtS8rJyU_7SVoXf6f3yNc8Eg88c10upP-BjUC0TthPe2m3a-7wXiV_uUg5V7pUxTVdwYe_wnXOsdB15QYP6J-SMJLVepYX-j2kYCLoc-ilIv6uTqKe47siL52mxK_jOr1qnfC7Jd2fAsGRpWw0tqo1Uu4VlM4LygeNDgS0gKAyfJHsoFwiyMaH2Aj48qBc0";

  // Default page content (in Markdown format for MarkdownContent component)
  const defaultHowItWorksContent = `## How It Works

Welcome to the Community Watch platform! This platform connects community members with local representatives to address issues and concerns in your area.

### Getting Started

1. **Register an Account:** Create your account by providing your basic information and verification details.
2. **Report Issues:** Submit issues or concerns you encounter in your community, such as infrastructure problems, safety concerns, or service requests.
3. **Track Progress:** Monitor the status of your submitted issues and receive updates on their resolution.
4. **View Reports:** Access community reports and statistics to stay informed about local developments.

### Features

- Submit and track community issues
- View community reports and statistics
- Receive notifications about issue updates
- Access aid programs and support services
- Connect with community leaders and staff

### Support

If you need assistance or have questions, please don't hesitate to contact us through the Contact page or reach out to your local community representatives.`;

  const defaultViewReportsContent = `## Lihat Laporan

Kekal dimaklumkan tentang aktiviti komuniti, statistik, dan perkembangan melalui sistem pelaporan komprehensif kami.

### Laporan Tersedia

- **Laporan Isu:** Jejaki semua isu yang dilaporkan dalam komuniti anda, termasuk status, keutamaan, dan kemajuan penyelesaian.
- **Statistik Komuniti:** Lihat data demografi, maklumat isi rumah, dan metrik komuniti.
- **Laporan Program Bantuan:** Akses maklumat tentang pengagihan bantuan dan penyertaan program.
- **Laporan Aktiviti:** Pantau aktiviti komuniti, pengumuman, dan metrik penglibatan.

### Cara Mengakses Laporan

1. Log masuk ke akaun anda
2. Navigasi ke bahagian Laporan
3. Pilih jenis laporan yang ingin anda lihat
4. Tapis dan sesuaikan laporan berdasarkan keperluan anda
5. Eksport atau kongsi laporan mengikut keperluan

### Ciri Laporan

- Kemas kini data masa nyata
- Penapis dan julat tarikh yang boleh disesuaikan
- Keupayaan eksport (PDF, Excel)
- Carta dan graf visual
- Perincian terperinci mengikut zon, kampung, atau kategori

Untuk maklumat lanjut atau bantuan dengan laporan, sila hubungi pentadbir komuniti anda.`;

  const defaultAboutUsContent = `## Tentang Kami

Selamat datang ke platform N.18 Inanam Community Watch, sistem penglibatan komuniti dan pengurusan isu yang komprehensif yang direka untuk mengukuhkan hubungan antara ahli komuniti dan wakil tempatan mereka.

### Misi Kami

Misi kami adalah untuk mewujudkan platform yang telus, cekap, dan responsif yang memberdayakan ahli komuniti untuk melaporkan isu, mengakses maklumat, dan terlibat dengan tadbir urus tempatan. Kami berusaha untuk meningkatkan kualiti hidup dalam komuniti kami dengan memudahkan komunikasi yang lebih baik dan penyelesaian masalah yang lebih pantas.

### Apa Yang Kami Lakukan

- **Pengurusan Isu:** Kami menyediakan sistem yang teratur untuk melaporkan dan menjejaki isu komuniti, memastikan mereka ditangani dengan segera dan cekap.
- **Penglibatan Komuniti:** Kami memudahkan komunikasi antara ahli komuniti, kakitangan, dan wakil untuk memupuk persekitaran kolaboratif.
- **Akses Maklumat:** Kami menyediakan akses mudah kepada laporan komuniti, statistik, dan pengumuman penting.
- **Perkhidmatan Sokongan:** Kami menghubungkan ahli komuniti dengan program bantuan, perkhidmatan sokongan, dan sumber yang tersedia di kawasan ini.

### Nilai Kami

- **Ketelusan:** Kami percaya pada komunikasi terbuka dan akauntabiliti.
- **Responsif:** Kami komited untuk menangani keperluan komuniti dengan cepat dan berkesan.
- **Inklusiviti:** Kami memastikan semua ahli komuniti mempunyai akses yang sama kepada perkhidmatan dan maklumat.
- **Integriti:** Kami mengekalkan standard perkhidmatan dan tingkah laku etika yang tertinggi.

### Maklumat Hubungan

Untuk maklumat lanjut tentang perkhidmatan kami atau untuk terlibat, sila lawati halaman Hubungi Kami atau hubungi wakil komuniti tempatan anda.`;

  const defaultContactContent = `## Hubungi Kami

Kami di sini untuk membantu! Hubungi kami melalui mana-mana kaedah berikut:

### Maklumat Pejabat

**N.18 Inanam Community Watch**  
Alamat: [Alamat Pejabat Anda]  
Telefon: [Nombor Telefon Anda]  
E-mel: [Alamat E-mel Anda]

### Waktu Pejabat

Isnin - Jumaat: 9:00 AM - 5:00 PM  
Sabtu: 9:00 AM - 1:00 PM  
Ahad: Tutup

### Kaedah Hubungan

- **Secara Peribadi:** Lawati pejabat kami semasa waktu perniagaan
- **Telefon:** Hubungi kami semasa waktu pejabat untuk bantuan segera
- **E-mel:** Hantar e-mel kepada kami dan kami akan membalas dalam masa 24-48 jam
- **Dalam Talian:** Hantar isu atau pertanyaan melalui platform ini

### Hubungan Kecemasan

Untuk kecemasan, sila hubungi:

- Polis: 999
- Bomba: 994
- Ambulans: 999

### Direktori Kakitangan

Anda juga boleh menghubungi kakitangan atau jabatan tertentu melalui platform. Log masuk untuk mengakses direktori kakitangan dan maklumat hubungan.

### Maklum Balas

Kami menghargai maklum balas anda! Jika anda mempunyai cadangan, komen, atau kebimbangan tentang perkhidmatan kami, jangan teragak-agak untuk menghubungi kami. Input anda membantu kami memperbaiki dan berkhidmat kepada komuniti dengan lebih baik.`;

  // Delete existing settings for these keys (in case they were created by migrations)
  await db.execute(sql`
    DELETE FROM app_settings 
    WHERE key IN ('admin_header_title', 'app_name', 'staff_login_image_url', 'admin_login_image_url', 'community_login_image_url', 'page_how_it_works_content', 'page_view_reports_content', 'page_about_us_content', 'page_contact_content')
  `);

  const settingsToInsert = [
    {
      key: "admin_header_title",
      value: "N.18 Inanam Community Watch",
      description: "The title displayed in the admin header",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "app_name",
      value: "Community Watch",
      description: "The application name displayed in the sidebar",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "staff_login_image_url",
      value: defaultLoginImageUrl,
      description: "The image URL displayed on the staff login page",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "admin_login_image_url",
      value: defaultLoginImageUrl,
      description: "The image URL displayed on the admin login page",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "community_login_image_url",
      value: defaultLoginImageUrl,
      description: "The image URL displayed on the community login page",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "page_how_it_works_content",
      value: defaultHowItWorksContent,
      description: "Content displayed on the 'How It Works' page. This page explains how the platform works to users.",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "page_view_reports_content",
      value: defaultViewReportsContent,
      description: "Content displayed on the 'View Reports' page. This page provides information about viewing community reports.",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "page_about_us_content",
      value: defaultAboutUsContent,
      description: "Content displayed on the 'About Us' page. This page provides information about the platform and organization.",
      updatedBy: settingsUpdatedBy,
    },
    {
      key: "page_contact_content",
      value: defaultContactContent,
      description: "Content displayed on the 'Contact' page. This page provides contact information and ways to reach out.",
      updatedBy: settingsUpdatedBy,
    },
  ];

  const insertedSettings = await db.insert(appSettings).values(settingsToInsert).returning();

  console.log(`✅ Seeded ${insertedSettings.length} app settings`);
  return { appSettings: insertedSettings };
}

seedFunctions['app_settings'] = seedAppSettings;
seedFunctions['app-settings'] = seedAppSettings; // Also support kebab-case

async function seedAnnouncements(existingData?: SeedResult): Promise<SeedResult> {
  console.log("📢 Seeding announcements...");

  // Check if we should clear existing data
  if (shouldClearData()) {
    await db.execute(sql`DELETE FROM announcements`);
  }

  const insertedAnnouncements = await db.insert(announcements).values([
    {
      title: "Penyelenggaraan Dewan Komuniti",
      content: "Dewan komuniti akan ditutup untuk penyelenggaraan dari 1 Ogos hingga 5 Ogos. Kami memohon maaf atas sebarang kesulitan yang disebabkan. Tempat alternatif untuk aktiviti komuniti akan diaturkan.",
      category: "general",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    },
    {
      title: "Mesyuarat Dewan Bandar Akan Datang",
      content: "Sertai kami untuk mesyuarat dewan bandar suku tahunan pada 28 Julai jam 7 PM untuk membincangkan projek komuniti yang akan datang dan menangani kebimbangan penduduk. Penyertaan anda adalah penting!",
      category: "general",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
    {
      title: "Notis Penutupan Jalan - Jalan Inanam 3",
      content: "Jalan Inanam 3 akan ditutup untuk kerja-kerja penurapan semula jalan dari 25 Julai hingga 27 Julai, 8 AM hingga 6 PM setiap hari. Sila gunakan laluan alternatif dalam tempoh ini.",
      category: "general",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      title: "Inisiatif Taman Komuniti Baharu",
      content: "Kami melancarkan inisiatif taman komuniti baharu! Penduduk yang berminat untuk menyertai boleh mendaftar di pusat komuniti. Benih percuma dan alat berkebun akan disediakan.",
      category: "general",
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ]).returning();

  console.log(`✅ Seeded ${insertedAnnouncements.length} announcements`);
  return { announcements: insertedAnnouncements };
}

seedFunctions['announcements'] = seedAnnouncements;

async function seed() {
  const tableToSeed = getTableToSeed();

  // If a specific table is requested, seed only that table
  if (tableToSeed) {
    const seedFunction = seedFunctions[tableToSeed.toLowerCase()];
    if (!seedFunction) {
      console.error(`❌ Error: Unknown table "${tableToSeed}"`);
      console.error(`\nAvailable tables:`);
      Object.keys(seedFunctions).forEach(key => {
        console.error(`   - ${key}`);
      });
      process.exit(1);
    }

    console.log(`🌱 Seeding table: ${tableToSeed}`);
    try {
      await seedFunction();
      console.log(`\n✅ Successfully seeded ${tableToSeed}`);
      return;
    } catch (error) {
      console.error(`❌ Error seeding ${tableToSeed}:`, error);
      throw error;
    }
  }

  // Full seed (original behavior)
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
    await db.execute(sql`DELETE FROM aids_distribution_records`);
    await db.execute(sql`DELETE FROM aids_program_assignments`);
    await db.execute(sql`DELETE FROM aids_program_zones`);
    await db.execute(sql`DELETE FROM aids_programs`);
    await db.execute(sql`DELETE FROM aid_distributions`);
    await db.execute(sql`DELETE FROM household_income`);
    await db.execute(sql`DELETE FROM household_members`);
    await db.execute(sql`DELETE FROM households`);
    await db.execute(sql`DELETE FROM staff_permissions`);
    await db.execute(sql`DELETE FROM role_assignments`);
    await db.execute(sql`DELETE FROM villages`);
    await db.execute(sql`DELETE FROM zones`);
    await db.execute(sql`DELETE FROM duns`);
    await db.execute(sql`DELETE FROM issue_assignments`);
    await db.execute(sql`DELETE FROM issue_feedback`);
    await db.execute(sql`DELETE FROM issue_media`);
    await db.execute(sql`DELETE FROM notifications`);
    await db.execute(sql`DELETE FROM issues`);
    await db.execute(sql`DELETE FROM issue_types`);
    await db.execute(sql`DELETE FROM support_requests`);
    await db.execute(sql`DELETE FROM announcements`);
    await db.execute(sql`DELETE FROM profiles`);
    await db.execute(sql`DELETE FROM staff`);
    // Note: roles and permissions are not deleted as they are seeded by migration

    // Seed data
    const seedResults: SeedResult = {};

    // 4.6. Insert Issue Types (must be before issues)
    const issueTypesResult = await seedIssueTypes();
    Object.assign(seedResults, issueTypesResult);
    const insertedIssueTypes = issueTypesResult.issueTypes;

    // 1. Get existing profiles from database (community users)
    console.log("👥 Fetching existing profiles from database...");
    const existingProfiles = await db.select().from(profiles);
    console.log(`   Found ${existingProfiles.length} existing profile(s)`);

    // Create additional seed profiles if we don't have enough (need at least 5 for variety)
    let insertedProfiles: Array<{ id: number;[key: string]: any }> = [];
    if (existingProfiles.length < 5) {
      console.log("👥 Creating additional seed profiles...");
      const seedProfiles = [
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
      ];

      // Only create profiles that don't already exist (check by email)
      const existingEmails = new Set(existingProfiles.map(p => p.email?.toLowerCase()).filter(Boolean));
      const profilesToCreate = seedProfiles.filter(p => !existingEmails.has(p.email.toLowerCase()));

      if (profilesToCreate.length > 0) {
        insertedProfiles = (await db.insert(profiles).values(profilesToCreate).returning()) as Array<{ id: number;[key: string]: any }>;
        console.log(`✅ Created ${insertedProfiles.length} additional seed profile(s)`);
      }
    }

    // Combine existing and newly created profiles
    const allProfiles = [...existingProfiles, ...insertedProfiles];
    console.log(`✅ Total profiles available: ${allProfiles.length}`);

    // Use allProfiles for the rest of the seeding
    const insertedProfilesForUse = allProfiles as Array<{ id: number;[key: string]: any }>;

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

    // 4.5. Insert App Settings (including login page images and page content)
    await seedAppSettings({ staff: insertedStaff });

    // 5. Insert Issues
    console.log("📋 Inserting issues...");

    // Helper function to find issue type by code
    const getIssueTypeId = (code: string) => {
      return insertedIssueTypes.find((it: { code: string | null; id: number }) => it.code === code)?.id || null;
    };

    // Generate issues with locations around Inanam and Manggatal, Sabah
    // Inanam center: ~6.0333°N, 116.1167°E
    // Manggatal center: ~6.0500°N, 116.1500°E
    const generateIssues = () => {
      const issueTemplates = [
        // Road Maintenance
        {
          category: "road_maintenance", code: "road_maintenance", titles: [
            "Pothole on {location}",
            "Cracked road surface at {location}",
            "Damaged road markings on {location}",
            "Uneven road surface near {location}",
            "Road erosion at {location}",
            "Missing road sign at {location}",
            "Damaged speed bump on {location}",
            "Road shoulder collapse at {location}",
          ], descriptions: [
            "There is a significant pothole that needs immediate attention. Vehicles are being damaged.",
            "The road surface has developed cracks and is deteriorating rapidly.",
            "Road markings have faded and need repainting for safety.",
            "The road surface is uneven, causing discomfort to drivers and potential vehicle damage.",
            "Road erosion has occurred due to heavy rain, creating a hazard.",
            "A road sign is missing, causing confusion for drivers.",
            "The speed bump is damaged and needs repair.",
            "The road shoulder has collapsed, narrowing the road.",
          ]
        },
        // Drainage
        {
          category: "drainage", code: "drainage", titles: [
            "Blocked drain at {location}",
            "Flooding issue at {location}",
            "Damaged drainage cover at {location}",
            "Overflowing drain near {location}",
            "Clogged drainage system at {location}",
            "Broken drain pipe at {location}",
            "Water accumulation at {location}",
            "Drainage system overflow at {location}",
          ], descriptions: [
            "The drainage system is blocked and water is accumulating on the road.",
            "Heavy rain causes flooding in this area due to poor drainage.",
            "A drainage cover is broken, creating a safety hazard.",
            "The drain is overflowing and water is spilling onto the road.",
            "The drainage system is completely clogged and needs cleaning.",
            "A drain pipe has broken and needs replacement.",
            "Water is accumulating due to poor drainage design.",
            "The drainage system cannot handle the water volume during rain.",
          ]
        },
        // Public Safety
        {
          category: "public_safety", code: "public_safety", titles: [
            "Broken street light at {location}",
            "Missing guardrail at {location}",
            "Unsafe pedestrian crossing at {location}",
            "Damaged safety barrier at {location}",
            "Dark area at {location} - needs lighting",
            "Hazardous tree branch at {location}",
            "Unsafe playground equipment at {location}",
            "Missing safety signage at {location}",
          ], descriptions: [
            "A street light is broken, making the area dark and unsafe at night.",
            "A guardrail is missing, creating a safety hazard for vehicles.",
            "The pedestrian crossing lacks proper safety measures.",
            "A safety barrier is damaged and needs immediate repair.",
            "This area is too dark at night and needs additional lighting.",
            "A large tree branch is hanging dangerously and may fall.",
            "Playground equipment is damaged and poses a safety risk.",
            "Safety signage is missing, creating confusion and potential hazards.",
          ]
        },
        // Sanitation
        {
          category: "sanitation", code: "sanitation", titles: [
            "Overflowing garbage bin at {location}",
            "Illegal dumping at {location}",
            "Uncollected garbage at {location}",
            "Damaged garbage collection point at {location}",
            "Foul smell from waste at {location}",
            "Garbage scattered at {location}",
            "Full garbage container at {location}",
            "Waste management issue at {location}",
          ], descriptions: [
            "The garbage bin is overflowing and garbage is spilling out.",
            "Someone has illegally dumped waste in this area.",
            "Garbage has not been collected for several days.",
            "The garbage collection point is damaged and needs repair.",
            "There is a strong foul smell coming from accumulated waste.",
            "Garbage has been scattered around, creating an eyesore.",
            "The garbage container is full and needs immediate collection.",
            "There is a waste management issue that needs attention.",
          ]
        },
        // Other
        {
          category: "other", code: "other", titles: [
            "Damaged public facility at {location}",
            "Vandalism at {location}",
            "Noise complaint at {location}",
            "Public amenity issue at {location}",
            "Community facility problem at {location}",
            "Infrastructure damage at {location}",
            "Public space issue at {location}",
            "General concern at {location}",
          ], descriptions: [
            "A public facility has been damaged and needs repair.",
            "Vandalism has occurred and needs to be addressed.",
            "There is excessive noise disturbing residents.",
            "A public amenity is not functioning properly.",
            "There is an issue with a community facility.",
            "Infrastructure has been damaged and requires attention.",
            "There is a problem with a public space.",
            "A general concern has been raised by residents.",
          ]
        },
      ];

      const locations = [
        // Inanam area locations
        { name: "Jalan Inanam", lat: 6.0333, lng: 116.1167 },
        { name: "Jalan Inanam 2", lat: 6.0340, lng: 116.1170 },
        { name: "Taman Inanam", lat: 6.0350, lng: 116.1180 },
        { name: "Kampung Inanam", lat: 6.0320, lng: 116.1150 },
        { name: "Taman Inanam Baru", lat: 6.0360, lng: 116.1190 },
        { name: "Jalan Inanam Lama", lat: 6.0310, lng: 116.1140 },
        { name: "Lorong Inanam 1", lat: 6.0335, lng: 116.1165 },
        { name: "Lorong Inanam 2", lat: 6.0338, lng: 116.1172 },
        { name: "Taman Inanam Indah", lat: 6.0370, lng: 116.1200 },
        { name: "Jalan Inanam Utara", lat: 6.0380, lng: 116.1210 },
        { name: "Jalan Inanam Selatan", lat: 6.0300, lng: 116.1130 },
        { name: "Taman Inanam Permai", lat: 6.0345, lng: 116.1175 },
        { name: "Kampung Inanam Baru", lat: 6.0325, lng: 116.1155 },
        { name: "Jalan Inanam Tengah", lat: 6.0330, lng: 116.1160 },
        { name: "Lorong Inanam 3", lat: 6.0342, lng: 116.1168 },
        // Manggatal area locations
        { name: "Jalan Manggatal", lat: 6.0500, lng: 116.1500 },
        { name: "Taman Manggatal", lat: 6.0510, lng: 116.1510 },
        { name: "Kampung Manggatal", lat: 6.0490, lng: 116.1490 },
        { name: "Jalan Manggatal Baru", lat: 6.0520, lng: 116.1520 },
        { name: "Lorong Manggatal 1", lat: 6.0505, lng: 116.1505 },
        { name: "Lorong Manggatal 2", lat: 6.0508, lng: 116.1512 },
        { name: "Taman Manggatal Indah", lat: 6.0530, lng: 116.1530 },
        { name: "Jalan Manggatal Utara", lat: 6.0540, lng: 116.1540 },
        { name: "Jalan Manggatal Selatan", lat: 6.0480, lng: 116.1480 },
        { name: "Taman Manggatal Permai", lat: 6.0515, lng: 116.1515 },
        { name: "Kampung Manggatal Baru", lat: 6.0495, lng: 116.1495 },
        { name: "Jalan Manggatal Tengah", lat: 6.0502, lng: 116.1502 },
        { name: "Lorong Manggatal 3", lat: 6.0512, lng: 116.1508 },
        { name: "Taman Manggatal Jaya", lat: 6.0525, lng: 116.1525 },
        { name: "Jalan Manggatal Lama", lat: 6.0485, lng: 116.1485 },
        // Areas between Inanam and Manggatal
        { name: "Jalan Inanam-Manggatal", lat: 6.0415, lng: 116.1335 },
        { name: "Taman Inanam-Manggatal", lat: 6.0420, lng: 116.1340 },
        { name: "Kampung Telipok", lat: 6.0400, lng: 116.1300 },
        { name: "Jalan Telipok", lat: 6.0405, lng: 116.1305 },
        { name: "Taman Telipok", lat: 6.0410, lng: 116.1310 },
      ];

      const statuses: Array<"pending" | "in_progress" | "resolved" | "closed"> = ["pending", "in_progress", "resolved", "closed"];
      const issues: Array<{
        reporterId: number;
        title: string;
        description: string;
        category: "road_maintenance" | "drainage" | "public_safety" | "sanitation" | "other";
        issueTypeId: number | null;
        status: "pending" | "in_progress" | "resolved" | "closed";
        address: string;
        lat: number;
        lng: number;
        createdAt?: Date;
        resolvedAt?: Date;
      }> = [];

      // Ensure we have at least one profile
      if (insertedProfilesForUse.length === 0) {
        throw new Error("No profiles available. Cannot generate issues without reporters.");
      }

      // Generate 100+ issues
      for (let i = 0; i < 100; i++) {
        const template = issueTemplates[i % issueTemplates.length];
        const location = locations[i % locations.length];
        const reporter = insertedProfilesForUse[i % insertedProfilesForUse.length];
        const status = statuses[i % statuses.length];
        const titleIndex = Math.floor(i / issueTemplates.length) % template.titles.length;
        const descIndex = Math.floor(i / issueTemplates.length) % template.descriptions.length;

        // Add small random variation to coordinates (±0.01 degrees ≈ ±1km)
        const latVariation = (Math.random() - 0.5) * 0.02;
        const lngVariation = (Math.random() - 0.5) * 0.02;

        const lat = location.lat + latVariation;
        const lng = location.lng + lngVariation;

        // Generate dates - spread over the last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        let resolvedAt: Date | undefined;
        if (status === "resolved" || status === "closed") {
          const daysToResolve = Math.floor(Math.random() * daysAgo);
          resolvedAt = new Date(Date.now() - daysToResolve * 24 * 60 * 60 * 1000);
        }

        issues.push({
          reporterId: reporter.id,
          title: template.titles[titleIndex].replace("{location}", location.name),
          description: template.descriptions[descIndex],
          category: template.category as "road_maintenance" | "drainage" | "public_safety" | "sanitation" | "other",
          issueTypeId: getIssueTypeId(template.code),
          status: status,
          address: `${location.name}, N.18 Inanam`,
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          createdAt: createdAt,
          resolvedAt: resolvedAt,
        });
      }

      return issues;
    };

    const issuesToInsert = generateIssues();
    const insertedIssues = await db.insert(issues).values(issuesToInsert).returning();

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
        profileId: insertedProfilesForUse[0]?.id,
        rating: 0,
        comments: "Thank you for reporting this. We are aware of the issue and working on it.",
      },
      {
        issueId: insertedIssues[2].id,
        profileId: insertedProfilesForUse[2]?.id,
        rating: 5,
        comments: "The street light has been fixed. Thank you for the quick response!",
      },
      {
        issueId: insertedIssues[0].id,
        profileId: insertedProfilesForUse[1]?.id,
        rating: 0,
        comments: "I've also noticed this pothole. It's getting worse with each rain.",
      },
      {
        issueId: insertedIssues[4].id,
        profileId: insertedProfilesForUse[3]?.id,
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
    const announcementsResult = await seedAnnouncements(seedResults);
    seedResults.announcements = announcementsResult.announcements;

    // 10. Insert Notifications
    console.log("🔔 Inserting notifications...");
    await db.insert(notifications).values([
      {
        profileId: insertedProfilesForUse[0]?.id,
        title: "Your issue has been received",
        body: "We have received your report about 'Pothole on Jalan Inanam near Community Hall'. Our team will review it shortly.",
        category: "system",
        read: false,
      },
      {
        profileId: insertedProfilesForUse[1]?.id,
        title: "Issue status updated",
        body: "Your issue 'Blocked Drainage System on Jalan Inanam 2' is now in progress.",
        category: "system",
        read: true,
      },
      {
        profileId: insertedProfilesForUse[2]?.id,
        title: "Issue resolved",
        body: "Your issue 'Broken Street Light at Taman Inanam' has been resolved. Thank you for reporting!",
        category: "system",
        read: false,
      },
      {
        profileId: insertedProfilesForUse[0]?.id,
        title: "New announcement",
        body: "Community Hall Maintenance - The community hall will be closed for maintenance from August 1st to August 5th.",
        category: "announcement",
        read: false,
      },
      {
        profileId: insertedProfilesForUse[3]?.id,
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

    // 12c. Insert Cawangan (one per zone for seed data)
    console.log("🏛️  Inserting cawangan...");
    const insertedCawangan = await db.insert(cawangan).values([
      {
        zoneId: insertedZones[0].id,
        name: "Cawangan A",
        code: "CA",
        description: "Default cawangan for Zone A",
      },
      {
        zoneId: insertedZones[1].id,
        name: "Cawangan B",
        code: "CB",
        description: "Default cawangan for Zone B",
      },
      {
        zoneId: insertedZones[2].id,
        name: "Cawangan C",
        code: "CC",
        description: "Default cawangan for Zone C",
      },
      {
        zoneId: insertedZones[3].id,
        name: "Cawangan D",
        code: "CD",
        description: "Default cawangan for Zone D",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedCawangan.length} cawangan`);

    // 12d. Insert Villages
    console.log("🏘️  Inserting villages...");
    const insertedVillages = await db.insert(villages).values([
      {
        cawanganId: insertedCawangan[0].id, // Zone A
        zoneId: insertedZones[0].id, // Keep for backward compatibility
        name: "Kampung Inanam",
        description: "Main village in Zone A",
      },
      {
        cawanganId: insertedCawangan[0].id, // Zone A
        zoneId: insertedZones[0].id, // Keep for backward compatibility
        name: "Kampung Likas",
        description: "Secondary village in Zone A",
      },
      {
        cawanganId: insertedCawangan[1].id, // Zone B
        zoneId: insertedZones[1].id, // Keep for backward compatibility
        name: "Kampung Menggatal",
        description: "Main village in Zone B",
      },
      {
        cawanganId: insertedCawangan[1].id, // Zone B
        zoneId: insertedZones[1].id, // Keep for backward compatibility
        name: "Kampung Telipok",
        description: "Secondary village in Zone B",
      },
      {
        cawanganId: insertedCawangan[2].id, // Zone C
        zoneId: insertedZones[2].id, // Keep for backward compatibility
        name: "Kampung Sepanggar",
        description: "Main village in Zone C",
      },
      {
        cawanganId: insertedCawangan[2].id, // Zone C
        zoneId: insertedZones[2].id, // Keep for backward compatibility
        name: "Kampung Tuaran",
        description: "Secondary village in Zone C",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedVillages.length} villages`);

    // 12c. Insert Role Assignments (ADUN appoints people to roles in zones/villages)
    console.log("👔 Inserting role assignments...");

    let insertedRoleAssignmentsCount = 0;

    // Get roles (they should exist from migration)
    const existingRoles = await db.select().from(roles);

    // Find Branch Chief and Village Chief roles (English names)
    const branchChiefRole = existingRoles.find(r => r.name === "Branch Chief");
    const villageChiefRole = existingRoles.find(r => r.name === "Village Chief");

    if (branchChiefRole && villageChiefRole && insertedVillages.length > 0) {
      // ADUN appoints staff to roles in different zones/villages
      // Branch Chief handles aids and household registration (can manage multiple villages)
      // Village Chief handles divorce, conflict, and community issues (one per village)

      const roleAssignmentsData = [];

      // Get villages for each zone
      const zoneAVillages = insertedVillages.filter(v => v.zoneId === insertedZones[0].id);
      const zoneBVillages = insertedVillages.filter(v => v.zoneId === insertedZones[1].id);
      const zoneCVillages = insertedVillages.filter(v => v.zoneId === insertedZones[2].id);

      // Assign Village Chief to first village in Zone A (one per village)
      if (insertedStaff.length > 4 && zoneAVillages.length > 0) {
        roleAssignmentsData.push({
          staffId: insertedStaff[4].id, // Tan Chee Keong
          roleId: villageChiefRole.id,
          zoneId: insertedZones[0].id, // Zone A
          villageId: zoneAVillages[0].id, // First village in Zone A
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Village Chief for this village",
        });
      }

      // Assign Branch Chief to Zone A (can manage multiple villages, but we'll assign to specific villages)
      if (insertedStaff.length > 3 && zoneAVillages.length > 0) {
        // Assign Branch Chief to first village in Zone A
        roleAssignmentsData.push({
          staffId: insertedStaff[3].id, // Fatimah binti Hassan
          roleId: branchChiefRole.id,
          zoneId: insertedZones[0].id, // Zone A
          villageId: zoneAVillages[0].id, // First village
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Branch Chief for this village (can manage multiple villages)",
        });
        // Assign same Branch Chief to second village if exists (demonstrating multiple villages)
        if (zoneAVillages.length > 1) {
          roleAssignmentsData.push({
            staffId: insertedStaff[3].id, // Same Branch Chief
            roleId: branchChiefRole.id,
            zoneId: insertedZones[0].id, // Zone A
            villageId: zoneAVillages[1].id, // Second village
            appointedBy: insertedStaff[0].id, // ADUN
            status: "active",
            notes: "Appointed by ADUN as Branch Chief for this village (manages multiple villages)",
          });
        }
      }

      // Assign Village Chief to first village in Zone B
      if (zoneLeaders.length > 1 && zoneBVillages.length > 0) {
        roleAssignmentsData.push({
          staffId: zoneLeaders[1].id, // Siti Nurhaliza (Zone B Leader)
          roleId: villageChiefRole.id,
          zoneId: insertedZones[1].id, // Zone B
          villageId: zoneBVillages[0].id, // First village in Zone B
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Village Chief for this village",
        });
      }

      // Assign Branch Chief to Zone B
      if (insertedStaff.length > 5 && zoneBVillages.length > 0) {
        roleAssignmentsData.push({
          staffId: insertedStaff[5].id, // Norazila binti Ahmad
          roleId: branchChiefRole.id,
          zoneId: insertedZones[1].id, // Zone B
          villageId: zoneBVillages[0].id, // First village
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Branch Chief for this village",
        });
      }

      // Assign Village Chief to first village in Zone C
      if (zoneLeaders.length > 2 && zoneCVillages.length > 0) {
        roleAssignmentsData.push({
          staffId: zoneLeaders[2].id, // Tan Ah Beng (Zone C Leader)
          roleId: villageChiefRole.id,
          zoneId: insertedZones[2].id, // Zone C
          villageId: zoneCVillages[0].id, // First village in Zone C
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Village Chief for this village",
        });
      }

      // Assign Branch Chief to Zone C
      if (insertedStaff.length > 2 && zoneCVillages.length > 0) {
        roleAssignmentsData.push({
          staffId: insertedStaff[2].id, // Lim Wei Ming (Staff Manager)
          roleId: branchChiefRole.id,
          zoneId: insertedZones[2].id, // Zone C
          villageId: zoneCVillages[0].id, // First village
          appointedBy: insertedStaff[0].id, // ADUN
          status: "active",
          notes: "Appointed by ADUN as Branch Chief for this village",
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
        headOfHouseholdId: insertedProfilesForUse[0]?.id,
        headName: "Amelia Tan",
        headIcNumber: "850101-10-1234",
        headPhone: "+60 12-345 6789",
        address: "123 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[0].id, // Zone A
        area: "Zone A",
        notes: "Elderly household, requires regular assistance",
      },
      {
        headOfHouseholdId: insertedProfilesForUse[1]?.id,
        headName: "Jane Doe",
        headIcNumber: "870305-08-5678",
        headPhone: "+60 12-345 6789",
        address: "456 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[1].id, // Zone B
        area: "Zone B",
        notes: "Single parent household",
      },
      {
        headOfHouseholdId: insertedProfilesForUse[2]?.id,
        headName: "Ahmad bin Abdullah",
        headIcNumber: "820715-12-9012",
        headPhone: "+60 13-456 7890",
        address: "789 Jalan Inanam, N.18 Inanam",
        zoneId: insertedZones[0].id, // Zone A
        area: "Zone A",
      },
      {
        headOfHouseholdId: insertedProfilesForUse[3]?.id,
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

    // 12d. Insert AIDS Programs
    console.log("📦 Inserting AIDS programs...");

    // Get ADUN staff ID (first staff member)
    const adunStaffId = insertedStaff[0].id;

    // Create AIDS programs
    const insertedAidsPrograms = await db.insert(aidsPrograms).values([
      {
        name: "Food Basket Distribution - December 2024",
        description: "Monthly food basket distribution for eligible households in selected zones",
        aidType: "Food Basket",
        status: "active",
        createdBy: adunStaffId,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        notes: "Priority given to low-income households and families with dependents",
      },
      {
        name: "Cash Aid Program - Q4 2024",
        description: "Quarterly cash assistance for households in need",
        aidType: "Cash Aid",
        status: "draft",
        createdBy: adunStaffId,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        notes: "One-time cash assistance of RM200 per eligible household",
      },
      {
        name: "Medical Supplies Distribution - January 2025",
        description: "Distribution of basic medical supplies to elderly and vulnerable households",
        aidType: "Medical Supplies",
        status: "active",
        createdBy: adunStaffId,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        notes: "Includes basic medicines, masks, and hygiene supplies",
      },
    ]).returning();

    console.log(`✅ Inserted ${insertedAidsPrograms.length} AIDS programs`);

    // Assign programs to zones
    console.log("📍 Assigning programs to zones...");
    const programZonesData = [];

    // Program 1 (Food Basket) - assigned to Zone A and Zone B
    if (insertedAidsPrograms[0] && insertedZones.length >= 2) {
      programZonesData.push({
        programId: insertedAidsPrograms[0].id,
        zoneId: insertedZones[0].id, // Zone A
        villageId: null,
      });
      programZonesData.push({
        programId: insertedAidsPrograms[0].id,
        zoneId: insertedZones[1].id, // Zone B
        villageId: null,
      });
    }

    // Program 2 (Cash Aid) - assigned to all zones
    if (insertedAidsPrograms[1] && insertedZones.length >= 3) {
      programZonesData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[0].id, // Zone A
        villageId: null,
      });
      programZonesData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[1].id, // Zone B
        villageId: null,
      });
      programZonesData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[2].id, // Zone C
        villageId: null,
      });
    }

    // Program 3 (Medical Supplies) - assigned to Zone A only
    if (insertedAidsPrograms[2] && insertedZones.length >= 1) {
      programZonesData.push({
        programId: insertedAidsPrograms[2].id,
        zoneId: insertedZones[0].id, // Zone A
        villageId: null,
      });
    }

    if (programZonesData.length > 0) {
      await db.insert(aidsProgramZones).values(programZonesData);
      console.log(`✅ Assigned programs to ${programZonesData.length} zone(s)`);
    }

    // Automatically assign programs to zone leaders
    console.log("👔 Assigning programs to zone leaders...");
    const programAssignmentsData = [];

    // Program 1 - assign to Zone A and Zone B leaders
    if (insertedAidsPrograms[0] && zoneLeaders.length >= 2) {
      programAssignmentsData.push({
        programId: insertedAidsPrograms[0].id,
        zoneId: insertedZones[0].id,
        assignedTo: zoneLeaders[0].id, // Zone A Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "active",
        notes: "Automatically assigned to zone leader when program was created",
      });
      programAssignmentsData.push({
        programId: insertedAidsPrograms[0].id,
        zoneId: insertedZones[1].id,
        assignedTo: zoneLeaders[1].id, // Zone B Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "active",
        notes: "Automatically assigned to zone leader when program was created",
      });
    }

    // Program 2 - assign to all zone leaders
    if (insertedAidsPrograms[1] && zoneLeaders.length >= 3) {
      programAssignmentsData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[0].id,
        assignedTo: zoneLeaders[0].id, // Zone A Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "pending",
        notes: "Automatically assigned to zone leader when program was created",
      });
      programAssignmentsData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[1].id,
        assignedTo: zoneLeaders[1].id, // Zone B Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "pending",
        notes: "Automatically assigned to zone leader when program was created",
      });
      programAssignmentsData.push({
        programId: insertedAidsPrograms[1].id,
        zoneId: insertedZones[2].id,
        assignedTo: zoneLeaders[2].id, // Zone C Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "pending",
        notes: "Automatically assigned to zone leader when program was created",
      });
    }

    // Program 3 - assign to Zone A leader
    if (insertedAidsPrograms[2] && zoneLeaders.length >= 1) {
      programAssignmentsData.push({
        programId: insertedAidsPrograms[2].id,
        zoneId: insertedZones[0].id,
        assignedTo: zoneLeaders[0].id, // Zone A Leader
        assignedBy: adunStaffId,
        assignmentType: "zone_leader",
        status: "active",
        notes: "Automatically assigned to zone leader when program was created",
      });
    }

    if (programAssignmentsData.length > 0) {
      await db.insert(aidsProgramAssignments).values(programAssignmentsData);
      console.log(`✅ Created ${programAssignmentsData.length} program assignments to zone leaders`);
    }

    // Assign some programs to Branch Chief (simulating zone leader assignments)
    console.log("👥 Assigning programs to Branch Chief...");
    const ketuaCawanganAssignments = [];

    // Get Branch Chief role assignments
    const existingRoleAssignments = await db.select().from(roleAssignments);
    // Get roles again (or reuse existingRoles if in scope - but it's not, so fetch again)
    const rolesForAids = await db.select().from(roles);
    const branchChiefRoleForAids = rolesForAids.find(r => r.name === "Branch Chief");

    if (branchChiefRoleForAids) {
      const branchChiefInZones = existingRoleAssignments.filter(
        ra => ra.roleId === branchChiefRoleForAids.id && ra.status === "active"
      );

      // Assign Program 1 (Food Basket) to Branch Chief in Zone A
      if (insertedAidsPrograms[0] && branchChiefInZones.length > 0) {
        const zoneABranchChief = branchChiefInZones.find(ra => ra.zoneId === insertedZones[0].id);
        if (zoneABranchChief && zoneLeaders.length > 0) {
          ketuaCawanganAssignments.push({
            programId: insertedAidsPrograms[0].id,
            zoneId: insertedZones[0].id,
            assignedTo: zoneABranchChief.staffId,
            assignedBy: zoneLeaders[0].id, // Zone A Leader assigns to Branch Chief
            assignmentType: "ketua_cawangan",
            status: "active",
            notes: "Assigned by zone leader to handle distribution in Zone A",
          });
        }
      }

      // Assign Program 3 (Medical Supplies) to Branch Chief in Zone A
      if (insertedAidsPrograms[2] && branchChiefInZones.length > 0) {
        const zoneABranchChief = branchChiefInZones.find(ra => ra.zoneId === insertedZones[0].id);
        if (zoneABranchChief && zoneLeaders.length > 0) {
          ketuaCawanganAssignments.push({
            programId: insertedAidsPrograms[2].id,
            zoneId: insertedZones[0].id,
            assignedTo: zoneABranchChief.staffId,
            assignedBy: zoneLeaders[0].id, // Zone A Leader assigns to Branch Chief
            assignmentType: "ketua_cawangan",
            status: "active",
            notes: "Assigned by zone leader to handle medical supplies distribution",
          });
        }
      }
    }

    if (ketuaCawanganAssignments.length > 0) {
      await db.insert(aidsProgramAssignments).values(ketuaCawanganAssignments);
      console.log(`✅ Created ${ketuaCawanganAssignments.length} program assignments to Branch Chief`);
    }

    // Create some distribution records (simulating Branch Chief marking households)
    console.log("✅ Creating distribution records...");
    const distributionRecordsData = [];

    // Program 1 - mark some households in Zone A as distributed
    if (insertedAidsPrograms[0] && insertedHouseholds.length >= 2 && ketuaCawanganAssignments.length > 0) {
      const zoneAHouseholds = insertedHouseholds.filter(h => h.zoneId === insertedZones[0].id);
      const branchChiefForZoneA = ketuaCawanganAssignments.find(
        ka => ka.programId === insertedAidsPrograms[0].id && ka.zoneId === insertedZones[0].id
      );

      if (zoneAHouseholds.length > 0 && branchChiefForZoneA) {
        // Mark first 2 households as distributed
        distributionRecordsData.push({
          programId: insertedAidsPrograms[0].id,
          householdId: zoneAHouseholds[0].id,
          markedBy: branchChiefForZoneA.assignedTo,
          markedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          notes: "Food basket distributed successfully",
        });
        if (zoneAHouseholds.length > 1) {
          distributionRecordsData.push({
            programId: insertedAidsPrograms[0].id,
            householdId: zoneAHouseholds[1].id,
            markedBy: branchChiefForZoneA.assignedTo,
            markedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            notes: "Food basket distributed",
          });
        }
      }
    }

    // Program 3 - mark one household in Zone A as distributed
    if (insertedAidsPrograms[2] && insertedHouseholds.length >= 1 && ketuaCawanganAssignments.length > 0) {
      const zoneAHouseholds = insertedHouseholds.filter(h => h.zoneId === insertedZones[0].id);
      const branchChiefForZoneA = ketuaCawanganAssignments.find(
        ka => ka.programId === insertedAidsPrograms[2].id && ka.zoneId === insertedZones[0].id
      );

      if (zoneAHouseholds.length > 0 && branchChiefForZoneA) {
        distributionRecordsData.push({
          programId: insertedAidsPrograms[2].id,
          householdId: zoneAHouseholds[0].id,
          markedBy: branchChiefForZoneA.assignedTo,
          markedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          notes: "Medical supplies distributed to elderly household",
        });
      }
    }

    if (distributionRecordsData.length > 0) {
      await db.insert(aidsDistributionRecords).values(distributionRecordsData);
      console.log(`✅ Created ${distributionRecordsData.length} distribution records`);
    }

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
    console.log(`   - ${allProfiles.length} profiles (${existingProfiles.length} existing + ${insertedProfiles.length} created)`);
    console.log(`   - ${insertedDuns.length} DUN(s)`);
    console.log(`   - ${insertedStaff.length + zoneLeaders.length} staff members (${insertedStaff.length} regular + ${zoneLeaders.length} zone leaders)`);
    console.log(`   - ${insertedIssueTypes.length} issue types`);
    console.log(`   - ${insertedIssues.length} issues`);
    console.log("   - 5 issue media items");
    console.log("   - 4 issue feedback entries");
    console.log("   - 3 issue assignments");
    console.log("   - 4 announcements");
    console.log("   - 5 notifications");
    console.log("   - 4 support requests");
    console.log(`   - ${insertedZones.length} zones`);
    console.log(`   - ${insertedVillages.length} villages`);
    if (insertedRoleAssignmentsCount > 0) {
      console.log(`   - ${insertedRoleAssignmentsCount} role assignments`);
    }
    console.log(`   - ${insertedHouseholds.length} households`);
    console.log(`   - ${insertedMembers.length} household members`);
    console.log("   - 6 household income records");
    console.log("   - 7 aid distributions");
    const allAidsPrograms = await db.select().from(aidsPrograms);
    console.log(`   - ${allAidsPrograms.length} AIDS programs`);
    const allProgramAssignments = await db.select().from(aidsProgramAssignments);
    console.log(`   - ${allProgramAssignments.length} program assignments`);
    const allDistributionRecords = await db.select().from(aidsDistributionRecords);
    console.log(`   - ${allDistributionRecords.length} distribution records`);
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
if (require.main === module) {
  seed()
    .then(() => {
      console.log("\n✅ Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seed script failed:", error);
      process.exit(1);
    });
}

export default seed;
export { seedFunctions, getTableToSeed, shouldClearData };
