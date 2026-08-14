export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeError(error: unknown): { error: string; code: string } {
  if (error instanceof Error) {
    return { error: error.message || "Internal server error", code: "INTERNAL_ERROR" };
  }
  return { error: "Internal server error", code: "INTERNAL_ERROR" };
}
