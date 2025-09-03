import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabaseFields() {
  try {
    // Test if we can access the reset fields
    const user = await prisma.user.findFirst();
    console.log("User model fields available:", Object.keys(user || {}));

    // Test creating a user with reset fields
    const testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        password: "test123",
        resetToken: "123456",
        resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
        resetAttempts: 0,
      },
    });

    console.log("✅ Successfully created user with reset fields:", {
      id: testUser.id,
      email: testUser.email,
      resetToken: testUser.resetToken,
      resetAttempts: testUser.resetAttempts,
    });

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("✅ Test user cleaned up");
  } catch (error) {
    console.error("❌ Database test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseFields().catch(console.error);
