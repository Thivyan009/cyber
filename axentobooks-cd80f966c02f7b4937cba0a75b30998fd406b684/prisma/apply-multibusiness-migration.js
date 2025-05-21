const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Function to execute shell commands
function exec(command) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  console.log("Starting multi-business migration...");

  // Generate migration
  console.log("Generating migration...");
  exec("npx prisma migrate dev --name multi_business_support --create-only");

  // Apply the SQL modifications to the generated migration
  const migrationsDir = path.join(__dirname, "migrations");
  const dirs = fs.readdirSync(migrationsDir);

  // Find the most recent migration
  const latestMigration = dirs
    .filter((dir) => dir.includes("multi_business_support"))
    .sort()
    .pop();

  if (!latestMigration) {
    console.error("Could not find the generated migration");
    process.exit(1);
  }

  const migrationPath = path.join(
    migrationsDir,
    latestMigration,
    "migration.sql"
  );

  // Add our custom SQL to the migration
  const customSql = `
-- Drop the unique constraint on the userId column in the businesses table
ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "businesses_userId_key";

-- Add onboardingCompleted column to businesses table if it doesn't exist
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
`;

  fs.appendFileSync(migrationPath, customSql);
  console.log("Applied custom SQL to migration file");

  // Apply the migration
  console.log("Applying migration...");
  exec("npx prisma migrate dev");

  // Generate Prisma client
  console.log("Generating Prisma client...");
  exec("npx prisma generate");

  console.log("Multi-business migration completed successfully!");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

 
 