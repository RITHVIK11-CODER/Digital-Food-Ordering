"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { Star, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { toast } from "sonner";

function FeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || "";
  const sessionId = searchParams.get("sessionId") || "sess-default";

  const [customerName, setCustomerName] = useState("");
  const [foodRating, setFoodRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId || undefined,
          sessionId,
          customerName: customerName.trim() || "Valued Guest",
          rating: foodRating,
          cafeAmbienceRating: ambienceRating,
          serviceRating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        toast.success("Thank you for your valuable feedback!");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-[#171717] border border-[#242424] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#6FAF82]/20 text-[#6FAF82] flex items-center justify-center mx-auto border border-[#6FAF82]/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-normal text-[#F6EFE7]">
          Thank You for Dining With Us!
        </h2>
        <p className="text-xs text-[#A8A29E] max-w-xs mx-auto">
          Your feedback inspires our baristas and chefs to continually elevate the Velvet Bloom experience.
        </p>
        <div className="pt-4">
          <Button variant="primary" className="text-xs" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#F6EFE7]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#171717] border border-[#242424] rounded-2xl p-6 shadow-xl space-y-6 text-[#F6EFE7]"
      >
        <div className="pb-3 border-b border-[#242424] text-center">
          <h1 className="font-serif text-2xl font-normal text-[#F6EFE7]">
            Guest Culinary Feedback
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            We value your honest impressions and culinary reflections
          </p>
        </div>

        {/* Guest Name */}
        <div>
          <label className="text-xs text-[#A8A29E] uppercase tracking-wider block mb-1">
            Your Name
          </label>
          <input
            type="text"
            placeholder="e.g. Eleanor Vance"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
          />
        </div>

        {/* Food Quality Star Rating */}
        <div className="space-y-2">
          <label className="text-xs text-[#A8A29E] uppercase tracking-wider block">
            Culinary & Beverage Quality
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setFoodRating(star)}
                className="p-1 text-2xl transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= foodRating
                      ? "fill-[#D8B58A] text-[#D8B58A]"
                      : "text-[#2e2e2e]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Ambience & Service Ratings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] text-[#A8A29E] uppercase tracking-wider block">
              Ambience
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setAmbienceRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= ambienceRating
                        ? "fill-[#C99A8A] text-[#C99A8A]"
                        : "text-[#2e2e2e]"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-[#A8A29E] uppercase tracking-wider block">
              Hospitality & Service
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setServiceRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= serviceRating
                        ? "fill-[#6FAF82] text-[#6FAF82]"
                        : "text-[#2e2e2e]"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-1">
          <label className="text-xs text-[#A8A29E] uppercase tracking-wider block">
            Thoughts & Suggestions
          </label>
          <textarea
            rows={3}
            placeholder="Share your culinary highlights, favorite flavors, or suggestions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl p-3 text-xs text-[#F6EFE7] outline-none resize-none"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full text-xs h-11"
        >
          Submit Review
        </Button>
      </form>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <CustomerHeader />
      <main className="flex-1 max-w-lg mx-auto w-full p-4 sm:p-6">
        <Suspense fallback={<LoadingState message="Loading review portal..." />}>
          <FeedbackContent />
        </Suspense>
      </main>
    </div>
  );
}

