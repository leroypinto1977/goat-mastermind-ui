import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Get admin details from environment
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@goatmastermind.com'
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123456'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', adminEmail)
    return
  }

  // Hash the admin password
  const hashedPassword = await hash(adminPassword, 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(), // Mark email as verified for admin
    }
  })

  console.log('✅ Admin user created:')
  console.log('📧 Email:', adminEmail)
  console.log('🔑 Password:', adminPassword)
  console.log('⚠️  Please change this password after first login!')

  // Create initial audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'ADMIN_CREATED',
      details: 'Initial admin user created during database seeding',
      ipAddress: '127.0.0.1',
      userAgent: 'System Seed Script'
    }
  })

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
