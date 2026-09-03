export const ADMIN_EMAILS = (
  (import.meta.env["VITE_ADMIN_EMAILS"] as string | undefined) ||
  "satishkumart77@gmail.com"
)
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);