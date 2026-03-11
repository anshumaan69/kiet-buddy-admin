import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import { ExtractedData } from '../../../models/ExtractedData';

// Get all records
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Superadmins see everything, admins see only their department
    const query = session.user.role === 'superadmin' ? {} : { department: session.user.department };
    const records = await ExtractedData.find(query).sort({ updatedAt: -1 });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new record
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, key, value } = await req.json();
    if (!category || !key || !value) {
      return NextResponse.json({ error: 'Category, Key, and Value are required' }, { status: 400 });
    }

    await dbConnect();
    
    const newRecord = await ExtractedData.create({
      department: session.user.department,
      category,
      key,
      value
    });

    return NextResponse.json({ message: 'Record created successfully', record: newRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update manual record
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, category, key, value } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Ensure the record belongs to the admin's department
    const record = await ExtractedData.findOne({ _id: id, department: session.user.department });
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found or unauthorized' }, { status: 404 });
    }

    if (category) record.category = category;
    if (key) record.key = key;
    if (value) record.value = value;

    await record.save();

    return NextResponse.json({ message: 'Record updated successfully', record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete manual record
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await dbConnect();
    const result = await ExtractedData.findOneAndDelete({ _id: id, department: session.user.department });

    if (!result) {
      return NextResponse.json({ error: 'Record not found or unauthorized to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
