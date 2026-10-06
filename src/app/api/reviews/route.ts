import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { CreateReviewSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const reviews = cafeStore.getReviews();
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validated = CreateReviewSchema.parse(json);

    const review = cafeStore.createReview({
      menuItemId: validated.menuItemId,
      orderId: validated.orderId,
      sessionId: validated.sessionId,
      customerName: validated.customerName,
      rating: validated.rating,
      comment: validated.comment,
      cafeAmbienceRating: validated.cafeAmbienceRating,
      serviceRating: validated.serviceRating,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
