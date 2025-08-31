import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        isFirstLogin: true,
        sessions: {
          select: {
            id: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For security, only return temp password info if user hasn't logged in
    // and only for recently created users (within last 24 hours)
    let tempPasswordMessage: string | null = null
    if (user.isFirstLogin) {
      // Show a message indicating that a temporary password was provided
      tempPasswordMessage = "Temporary password was provided during user creation"
    }

    return NextResponse.json({
      ...user,
      isFirstLogin: user.isFirstLogin,
      tempPasswordMessage
    })
  } catch (error) {
    console.error('Get user details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
