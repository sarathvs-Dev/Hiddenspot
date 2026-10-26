export const USER_ROLES = ['explorer', 'moderator', 'curator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Fictional demo account. There is no real authentication in Phase 1. */
export interface DemoUser {
  id: string;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  homeDistrict: string | null;
  joinedAt: string;
  isDemo: true;
}
