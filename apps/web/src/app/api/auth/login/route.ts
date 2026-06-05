import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // In a real application, validate against a database and set a secure session cookie
    // For this prototype, we'll use a hardcoded admin credential
    if (email === 'admin@admin.com' && password === 'admin123') {
      return Response.json({ success: true });
    }

    return Response.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
