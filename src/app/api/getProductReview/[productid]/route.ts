import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';

export async function GET(request: NextRequest) {
  const productid = request.nextUrl.pathname.split('/').pop();

  if (!productid) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const reviews = await db.review.findMany({
      where: { productid: productid },
      select: { rating: true },
    });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}