import { UserRole } from "@/types/database.types";

export interface AuthContext {
  role: UserRole;
  userId?: string;
  tableSessionId?: string;
}

export const PERMISSIONS = {
  // Menu
  VIEW_MENU: ["CUSTOMER", "CHEF", "WAITER", "CASHIER", "MANAGER", "OWNER"] as UserRole[],
  MANAGE_MENU: ["MANAGER", "OWNER"] as UserRole[],
  TOGGLE_ITEM_AVAILABILITY: ["MANAGER", "OWNER", "CHEF"] as UserRole[],

  // Orders
  CREATE_ORDER: ["CUSTOMER", "WAITER", "CASHIER", "MANAGER", "OWNER"] as UserRole[],
  ACCEPT_ORDER: ["CHEF", "MANAGER", "OWNER"] as UserRole[],
  PREPARE_ORDER: ["CHEF", "MANAGER", "OWNER"] as UserRole[],
  READY_ORDER: ["CHEF", "MANAGER", "OWNER"] as UserRole[],
  SERVE_ORDER: ["WAITER", "MANAGER", "OWNER"] as UserRole[],
  ADD_ADDITIONAL_ITEM: ["WAITER", "CASHIER", "MANAGER", "OWNER"] as UserRole[],

  // Billing
  REQUEST_BILL: ["CUSTOMER", "WAITER", "CASHIER", "MANAGER", "OWNER"] as UserRole[],
  CREATE_MANUAL_BILL: ["CASHIER", "MANAGER", "OWNER"] as UserRole[],
  SETTLE_PAYMENT: ["CASHIER", "MANAGER", "OWNER", "CUSTOMER"] as UserRole[],

  // Operations & Admin
  VIEW_15DAY_ANALYTICS: ["MANAGER", "OWNER"] as UserRole[],
  MANAGE_TABLES: ["MANAGER", "OWNER"] as UserRole[],
  MANAGE_STAFF: ["OWNER"] as UserRole[],
  TOGGLE_ORDERING_PAUSE: ["MANAGER", "OWNER"] as UserRole[],
};

/**
 * Server-side RBAC validation helper.
 * Throws or returns boolean if user role is not permitted.
 */
export function verifyPermission(role: UserRole, permissionKey: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permissionKey];
  return allowedRoles.includes(role);
}

/**
 * Validates request role from Authorization header, staff session, or request body.
 */
export function extractAuthContext(req: Request): AuthContext {
  const authHeader = req.headers.get("x-staff-role") || req.headers.get("authorization");
  
  if (authHeader) {
    const roleCandidate = authHeader.replace("Bearer ", "").toUpperCase() as UserRole;
    if (["OWNER", "MANAGER", "CHEF", "WAITER", "CASHIER"].includes(roleCandidate)) {
      return { role: roleCandidate };
    }
  }

  const tableSessionHeader = req.headers.get("x-table-session");
  return {
    role: "CUSTOMER",
    tableSessionId: tableSessionHeader || undefined,
  };
}
