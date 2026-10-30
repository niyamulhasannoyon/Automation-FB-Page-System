import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { IAutomationRule } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Finds the first matching rule for a given text message or comment.
 * Matching is case-insensitive and trims surrounding whitespace.
 */
export function findMatchingRule(
  text: string,
  rules: IAutomationRule[]
): IAutomationRule | null {
  if (!text || !Array.isArray(rules)) return null;
  const normalizedText = text.trim().toLowerCase();

  for (const rule of rules) {
    if (!rule.isActive) continue;
    const ruleKeyword = rule.keyword.trim().toLowerCase();
    if (!ruleKeyword) continue;

    if (rule.matchType === "exact") {
      if (normalizedText === ruleKeyword) {
        return rule;
      }
    } else {
      // contains
      if (normalizedText.includes(ruleKeyword)) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Format date nicely for table / activity logs
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(d);
}

/**
 * Truncate long strings with ellipsis
 */
export function truncate(str: string, maxLength: number = 40): string {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}
