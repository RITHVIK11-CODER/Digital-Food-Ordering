import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  try {
    const auth = extractAuthContext(request);
    if (!verifyPermission(auth.role, "MANAGE_MENU")) {
      return NextResponse.json(
        { error: "Forbidden: Only Owner or Operations Manager can upload menu images." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP, and AVIF images are allowed." },
        { status: 400 }
      );
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const supabase = getAdminSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from("menu-items")
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from("menu-items")
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
          }
        }
      } catch (storageErr) {
        console.warn("Supabase Storage bucket upload fallback to Data URI:", storageErr);
      }
    }

    // Fallback: Data URI
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ imageUrl: dataUri });
  } catch (error: any) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
