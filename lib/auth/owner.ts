export const OWNER_EMAIL = "asimuaf41@gmail.com";

export function isOwnerEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}
