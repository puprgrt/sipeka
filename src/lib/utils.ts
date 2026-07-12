import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuditHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-email": localStorage.getItem("userEmail") || "admin@sipeka.com",
    "x-user-name": localStorage.getItem("userName") || "Sistem Admin",
    "x-user-role": localStorage.getItem("activeRole") || "Administrator",
  };
}
