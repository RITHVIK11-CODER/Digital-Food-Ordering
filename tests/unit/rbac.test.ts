import { describe, it, expect } from "vitest";
import { verifyPermission, PERMISSIONS } from "@/lib/auth/rbac";

describe("Server-Side RBAC Enforcement Suite", () => {
  it("allows OWNER to perform all operations", () => {
    expect(verifyPermission("OWNER", "MANAGE_MENU")).toBe(true);
    expect(verifyPermission("OWNER", "VIEW_15DAY_ANALYTICS")).toBe(true);
    expect(verifyPermission("OWNER", "MANAGE_STAFF")).toBe(true);
    expect(verifyPermission("OWNER", "TOGGLE_ORDERING_PAUSE")).toBe(true);
    expect(verifyPermission("OWNER", "CREATE_MANUAL_BILL")).toBe(true);
    expect(verifyPermission("OWNER", "ACCEPT_ORDER")).toBe(true);
    expect(verifyPermission("OWNER", "SERVE_ORDER")).toBe(true);
  });

  it("strictly prohibits CHEF from managing staff, creating manual bills, or viewing owner analytics", () => {
    expect(verifyPermission("CHEF", "MANAGE_STAFF")).toBe(false);
    expect(verifyPermission("CHEF", "VIEW_15DAY_ANALYTICS")).toBe(false);
    expect(verifyPermission("CHEF", "CREATE_MANUAL_BILL")).toBe(false);
    expect(verifyPermission("CHEF", "TOGGLE_ORDERING_PAUSE")).toBe(false);
    expect(verifyPermission("CHEF", "MANAGE_MENU")).toBe(false);
    // CHEF can accept/prepare/ready orders
    expect(verifyPermission("CHEF", "ACCEPT_ORDER")).toBe(true);
    expect(verifyPermission("CHEF", "PREPARE_ORDER")).toBe(true);
    expect(verifyPermission("CHEF", "READY_ORDER")).toBe(true);
  });

  it("strictly prohibits WAITER from managing menu or settling manual bills without cashier role", () => {
    expect(verifyPermission("WAITER", "MANAGE_MENU")).toBe(false);
    expect(verifyPermission("WAITER", "VIEW_15DAY_ANALYTICS")).toBe(false);
    expect(verifyPermission("WAITER", "CREATE_MANUAL_BILL")).toBe(false);
    // WAITER can serve orders and add additional items
    expect(verifyPermission("WAITER", "SERVE_ORDER")).toBe(true);
    expect(verifyPermission("WAITER", "ADD_ADDITIONAL_ITEM")).toBe(true);
  });

  it("strictly prohibits CASHIER from managing staff, pausing kitchen, or accepting orders", () => {
    expect(verifyPermission("CASHIER", "MANAGE_STAFF")).toBe(false);
    expect(verifyPermission("CASHIER", "ACCEPT_ORDER")).toBe(false);
    expect(verifyPermission("CASHIER", "TOGGLE_ORDERING_PAUSE")).toBe(false);
    // CASHIER can create manual bills and settle payments
    expect(verifyPermission("CASHIER", "CREATE_MANUAL_BILL")).toBe(true);
    expect(verifyPermission("CASHIER", "SETTLE_PAYMENT")).toBe(true);
  });

  it("strictly prohibits CUSTOMER from all staff actions", () => {
    expect(verifyPermission("CUSTOMER", "ACCEPT_ORDER")).toBe(false);
    expect(verifyPermission("CUSTOMER", "PREPARE_ORDER")).toBe(false);
    expect(verifyPermission("CUSTOMER", "READY_ORDER")).toBe(false);
    expect(verifyPermission("CUSTOMER", "SERVE_ORDER")).toBe(false);
    expect(verifyPermission("CUSTOMER", "MANAGE_MENU")).toBe(false);
    expect(verifyPermission("CUSTOMER", "VIEW_15DAY_ANALYTICS")).toBe(false);
    expect(verifyPermission("CUSTOMER", "MANAGE_STAFF")).toBe(false);
    // CUSTOMER can view menu and place order
    expect(verifyPermission("CUSTOMER", "VIEW_MENU")).toBe(true);
    expect(verifyPermission("CUSTOMER", "CREATE_ORDER")).toBe(true);
  });
});
