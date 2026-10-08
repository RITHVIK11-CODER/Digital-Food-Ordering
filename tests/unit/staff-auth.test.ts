import { describe, it, expect } from "vitest";
import {
  createStaffSessionToken,
  verifyStaffSessionToken,
  verifyStaffCredentials,
  DEFAULT_STAFF_USERS,
  getStaffSessionFromCookieString,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/staff-auth";

describe("Staff Authentication & PIN Security Suite", () => {
  it("authenticates default staff roles with correct PIN codes", async () => {
    const adminRes = await verifyStaffCredentials("OWNER", "1111");
    expect(adminRes.success).toBe(true);
    expect(adminRes.user?.role).toBe("OWNER");

    const chefRes = await verifyStaffCredentials("CHEF", "2222");
    expect(chefRes.success).toBe(true);
    expect(chefRes.user?.role).toBe("CHEF");

    const waiterRes = await verifyStaffCredentials("WAITER", "3333");
    expect(waiterRes.success).toBe(true);
    expect(waiterRes.user?.role).toBe("WAITER");

    const cashierRes = await verifyStaffCredentials("CASHIER", "4444");
    expect(cashierRes.success).toBe(true);
    expect(cashierRes.user?.role).toBe("CASHIER");

    const managerRes = await verifyStaffCredentials("MANAGER", "5555");
    expect(managerRes.success).toBe(true);
    expect(managerRes.user?.role).toBe("MANAGER");
  });

  it("rejects invalid PIN codes securely", async () => {
    const wrongPin = await verifyStaffCredentials("OWNER", "9999");
    expect(wrongPin.success).toBe(false);
    expect(wrongPin.user).toBeUndefined();

    const shortPin = await verifyStaffCredentials("CHEF", "22");
    expect(shortPin.success).toBe(false);

    const emptyPin = await verifyStaffCredentials("WAITER", "");
    expect(emptyPin.success).toBe(false);
  });

  it("cryptographically signs and verifies session tokens with HMAC-SHA256", () => {
    const sessionUser = {
      id: "usr-admin-01",
      role: "OWNER" as const,
      name: "Alexander Vance",
    };

    const token = createStaffSessionToken(sessionUser);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(2);

    const verified = verifyStaffSessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(sessionUser.id);
    expect(verified?.role).toBe("OWNER");
    expect(verified?.staffName).toBe("Alexander Vance");
  });

  it("rejects tampered or forged session tokens", () => {
    const validToken = createStaffSessionToken({
      id: "usr-waiter-01",
      role: "WAITER",
      name: "Elena Rostova",
    });

    // Tamper with payload part
    const [payloadB64, signature] = validToken.split(".");
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    decodedPayload.role = "OWNER"; // Privilege escalation attempt
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
    const forgedToken = `${tamperedPayloadB64}.${signature}`;

    const result = verifyStaffSessionToken(forgedToken);
    expect(result).toBeNull();
  });

  it("rejects expired session tokens", () => {
    const expiredPayload = {
      userId: "usr-chef-01",
      role: "CHEF" as const,
      staffName: "Marcus Chen",
      exp: Date.now() - 3600000, // Expired 1 hour ago
    };

    const payloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
    // Sign with HMAC
    const crypto = require("crypto");
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "velvet-bloom-staff-secret-key-2026";
    const signature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
    const expiredToken = `${payloadB64}.${signature}`;

    const result = verifyStaffSessionToken(expiredToken);
    expect(result).toBeNull();
  });

  it("correctly parses session cookie string from HTTP requests", () => {
    const token = createStaffSessionToken({
      id: "usr-cashier-01",
      role: "CASHIER",
      name: "David Miller",
    });

    const cookieHeader = `theme=dark; ${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; visitor=1`;
    const session = getStaffSessionFromCookieString(cookieHeader);
    expect(session).not.toBeNull();
    expect(session?.role).toBe("CASHIER");
    expect(session?.staffName).toBe("David Miller");
  });
});

