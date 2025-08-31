import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const authService = new AuthService()
    const result = await authService.revokeAllUserSessions(userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'All user sessions terminated successfully'
    })
  } catch (error) {
    console.error('Error terminating sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
