import React from "react";
import { OrderStatus, TableStatus } from "@/types/database.types";
import { Badge } from "./Badge";

interface StatusBadgeProps {
  status: OrderStatus | TableStatus | string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="warning" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A34A] animate-pulse" />
          Pending
        </Badge>
      );
    case "ACCEPTED":
      return (
        <Badge variant="gold" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D8B58A]" />
          Accepted
        </Badge>
      );
    case "PREPARING":
      return (
        <Badge variant="rose" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C99A8A] animate-spin" />
          Preparing
        </Badge>
      );
    case "READY":
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6FAF82] animate-bounce" />
          Ready
        </Badge>
      );
    case "SERVED":
      return (
        <Badge variant="default" className={className}>
          Served
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="success" className={className}>
          Completed
        </Badge>
      );
    case "CANCELLED":
    case "REJECTED":
      return (
        <Badge variant="error" className={className}>
          {status === "CANCELLED" ? "Cancelled" : "Rejected"}
        </Badge>
      );
    default:
      return <Badge variant="secondary" className={className}>{status}</Badge>;
  }
}

export function TableStatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6FAF82]" />
          Available
        </Badge>
      );
    case "OCCUPIED":
      return (
        <Badge variant="rose" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C99A8A]" />
          Occupied
        </Badge>
      );
    case "BILL_REQUESTED":
      return (
        <Badge variant="warning" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A34A] animate-pulse" />
          Bill Requested
        </Badge>
      );
    case "PAYMENT_PENDING":
      return (
        <Badge variant="gold" className={className}>
          Payment Pending
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="success" className={className}>
          Paid
        </Badge>
      );
    case "CLEANING":
      return (
        <Badge variant="secondary" className={className}>
          Cleaning
        </Badge>
      );
    default:
      return <Badge variant="secondary" className={className}>{status}</Badge>;
  }
}

