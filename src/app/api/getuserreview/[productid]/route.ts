import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { getUserIdFromSession } from '@/app/actions/getUserID';

export async function GET(request: NextRequest) {
  const productid = request.nextUrl.pathname.split('/').pop(); // Get the last segment of the path
  console.log("Extracted Product ID:", productid); // Log the product ID for debugging

  const userid = await getUserIdFromSession();

  if (!productid || !userid) {
    return NextResponse.json({ error: 'Product ID and User ID are required' }, { status: 400 });
  }
  console.log("FETCH REVIEW", productid, userid)

  try {
    const review = await db.review.findFirst({
      where: { productid: productid, userid: userid },
      select: { rating: true },
    });

    if (review) {
      return NextResponse.json(review, { status: 200 });
    }

    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}