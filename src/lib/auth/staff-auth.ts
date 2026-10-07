import crypto from "crypto";
import { UserRole, User } from "@/types/database.types";
import { getUsersFromDb } from "@/lib/supabase/db";
import { INITIAL_USERS } from "@/lib/store/seed-data";

const SESSION_COOKIE_NAME = "vb_staff_session";
const SESSION_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "velvet-bloom-staff-secret-key-2026";
const SESSION_DURATION_HOURS = 12;

export interface StaffSessionPayload {
  userId: string;
  role: UserRole;
  staffName: string;
  exp: number;
}

// Fallback staff PIN mapping for small café deployment
export const DEFAULT_STAFF_USERS: Array<{
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string;
}> = [
  { id: "b0000000-0000-0000-0000-000000000001", name: "Alexander Vance (Owner)", email: "owner@velvetbloom.com", role: "OWNER", pin: "1111" },
  { id: "b0000000-0000-0000-0000-000000000002", name: "Chef Marcus Chen (Head Chef)", email: "chef@velvetbloom.com", role: "CHEF", pin: "2222" },
  { id: "b0000000-0000-0000-0000-000000000003", name: "Elena Rostova (Floor Lead)", email: "waiter@velvetbloom.com", role: "WAITER", pin: "3333" },
  { id: "b0000000-0000-0000-0000-000000000004", name: "David Miller (Cashier)", email: "cashier@velvetbloom.com", role: "CASHIER", pin: "4444" },
  { id: "b0000000-0000-0000-0000-000000000005", name: "Sophia Williams (Manager)", email: "manager@velvetbloom.com", role: "MANAGER", pin: "5555" },
];

/**
 * Validates Role + PIN server-side against Supabase PostgreSQL or authoritative config.
 */
export async function verifyStaffCredentials(role: UserRole, pin: string): Promise<{ success: boolean; user?: { id: string; name: string; role: UserRole }; error?: string }> {
  const cleanPin = pin ? pin.trim() : "";
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: "Invalid PIN code format. 4 digits required." };
  }

  // 1. Check Supabase DB first
  try {
    const dbUsers = await getUsersFromDb();
    if (dbUsers && dbUsers.length > 0) {
      // Find user matching role (or OWNER/MANAGER equivalence) and PIN
      const matched = dbUsers.find((u) => {
        const roleMatches = u.role === role || (role === "OWNER" && u.role === "MANAGER") || (role === "MANAGER" && u.role === "OWNER");
        return roleMatches && u.pin_code === cleanPin && u.is_active;
      });

      if (matched) {
        return {
          success: true,
          user: {
            id: matched.id,
            name: matched.full_name,
            role: matched.role,
          },
        };
      }
    }
  } catch (err) {
    console.warn("DB user verification fallback:", err);
  }

  // 2. Authoritative fallback
  const fallback = DEFAULT_STAFF_USERS.find((u) => {
    const roleMatches = u.role === role || (role === "OWNER" && (u.role === "OWNER" || u.role === "MANAGER"));
    return roleMatches && u.pin === cleanPin;
  });

  if (fallback) {
    return {
      success: true,
      user: {
        id: fallback.id,
        name: fallback.name,
        role: fallback.role,
      },
    };
  }

  return { success: false, error: "Incorrect PIN for selected workstation." };
}

/**
 * Generates an HMAC-SHA256 signed session token.
 */
export function createStaffSessionToken(user: { id: string; name: string; role: UserRole }): string {
  const payload: StaffSessionPayload = {
    userId: user.id,
    role: user.role,
    staffName: user.name,
    exp: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes HMAC-SHA256 session token.
 */
export function verifyStaffSessionToken(token: string): StaffSessionPayload | null {
  if (!token || !token.includes(".")) return null;

  try {
    const [payloadB64, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: StaffSessionPayload = JSON.parse(payloadStr);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to extract staff session from cookie string or Request.
 */
export function getStaffSessionFromCookieString(cookieString?: string | null): StaffSessionPayload | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  if (!match || !match[1]) return null;
  return verifyStaffSessionToken(decodeURIComponent(match[1]));
}

export { SESSION_COOKIE_NAME };
