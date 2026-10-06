import { z } from "zod";

export const OrderItemOptionSchema = z.object({
  groupName: z.string().min(1),
  optionName: z.string().min(1),
  extraPrice: z.number().nonnegative().default(0),
});

export const CreateOrderItemSchema = z.object({
  menuItemId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().min(1).max(99),
  specialNotes: z.string().max(250).optional(),
  selectedOptions: z.array(OrderItemOptionSchema).optional().default([]),
});

export const CreateOrderSchema = z.object({
  tableId: z.string().uuid().or(z.string().min(1)),
  sessionId: z.string().uuid().or(z.string().min(1)),
  customerName: z.string().max(100).optional().default("Guest"),
  customerPhone: z.string().max(20).optional(),
  items: z.array(CreateOrderItemSchema).min(1, "Order must have at least one item"),
  specialInstructions: z.string().max(500).optional(),
});

export const AddItemToOrderSchema = z.object({
  orderId: z.string().uuid().or(z.string().min(1)),
  menuItemId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().min(1).max(50),
  specialNotes: z.string().max(250).optional(),
  selectedOptions: z.array(OrderItemOptionSchema).optional().default([]),
  staffId: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid().or(z.string().min(1)),
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
  ]),
  actorType: z.enum(["CHEF", "WAITER", "CASHIER", "OWNER", "SYSTEM"]).optional().default("CHEF"),
  actorId: z.string().optional(),
  notes: z.string().optional(),
  estimatedMinutes: z.number().optional(),
});

export const CreateManualBillSchema = z.object({
  tableId: z.string().uuid().or(z.string().min(1)),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1),
      specialNotes: z.string().optional(),
      selectedOptions: z.array(OrderItemOptionSchema).optional().default([]),
    })
  ).min(1, "At least one item is required"),
  discount: z.number().nonnegative().optional().default(0),
  serviceChargeRate: z.number().nonnegative().optional().default(0),
  staffId: z.string().optional(),
});

export const CreateReviewSchema = z.object({
  menuItemId: z.string().optional(),
  orderId: z.string().optional(),
  sessionId: z.string().min(1),
  customerName: z.string().min(1, "Name is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  cafeAmbienceRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
});

export const ServiceRequestSchema = z.object({
  tableId: z.string().min(1),
  sessionId: z.string().min(1),
  requestType: z.enum(["WATER", "CLEANING", "WAITER_CALL", "BILL", "OTHER"]),
  notes: z.string().max(200).optional(),
});

