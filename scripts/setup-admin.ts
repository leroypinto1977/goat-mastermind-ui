import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Setting up initial admin user...");

    const adminEmail =
      process.env.INITIAL_ADMIN_EMAIL || "admin@goatscripting.com";
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123!";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", adminEmail);
      console.log("Email:", adminEmail);
      console.log("Role:", existingAdmin.role);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Admin user created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Please change the password after first login.");

    // Log the setup - only if auditLog model exists
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "INITIAL_SETUP",
          details: "Initial admin user created during setup",
        },
      });
    } catch (auditError) {
      console.log("Note: Audit logging not available yet");
    }
  } catch (error) {
    console.error("Error setting up admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
