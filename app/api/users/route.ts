import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import { User } from '../../../models/User';
import bcrypt from 'bcryptjs';

// Get all users (only accessible by superadmin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({}).select('-password');
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new admin user (handled by superadmin)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, role, department } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      department: role === 'admin' ? department : undefined,
    });

    return NextResponse.json({ message: 'User created', user: { email: newUser.email, role: newUser.role, department: newUser.department, _id: newUser._id } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
