export type SubscriptionTier = "Free" | "Pro" | "Pass_Pro";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetExam: string;
  avatarUrl: string;
  joinedDate: string;
  subscriptionTier: SubscriptionTier;
  grantedTestIds: string[];
  state: string;
  city: string;
};

export const USER_PROFILE_STORAGE_KEY = "rankdon.user-profile";

export function getDefaultProfile(email = ""): UserProfile {
  const year = new Date().getFullYear();

  return {
    id: `RD-${year}-001`,
    name: email ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) : "Rankdon Student",
    email,
    phone: "+91 ",
    targetExam: "SSC CGL",
    avatarUrl: "",
    joinedDate: new Date().toISOString(),
    subscriptionTier: "Free",
    grantedTestIds: [],
    state: "",
    city: "",
  };
}

function isValidTier(value: unknown): value is SubscriptionTier {
  return value === "Free" || value === "Pro" || value === "Pass_Pro";
}

export function getUserProfile(email = ""): UserProfile {
  if (typeof window === "undefined") {
    return getDefaultProfile(email);
  }

  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) {
      return getDefaultProfile(email);
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const base = getDefaultProfile(email || parsed.email || "");

    return {
      ...base,
      ...parsed,
      email: parsed.email || email || base.email,
      grantedTestIds: Array.isArray(parsed.grantedTestIds) ? parsed.grantedTestIds : [],
      subscriptionTier: isValidTier(parsed.subscriptionTier) ? parsed.subscriptionTier : base.subscriptionTier,
      name: parsed.name || base.name,
      phone: parsed.phone || base.phone,
      targetExam: parsed.targetExam || base.targetExam,
      state: parsed.state || base.state,
      city: parsed.city || base.city,
    };
  } catch {
    return getDefaultProfile(email);
  }
}

export function setUserProfile(profile: Partial<UserProfile>, emailOverride = ""): UserProfile {
  if (typeof window === "undefined") {
    return getDefaultProfile(emailOverride);
  }

  const base = getUserProfile(emailOverride || profile.email || "");
  const next: UserProfile = {
    ...base,
    ...profile,
    email: profile.email || emailOverride || base.email,
    grantedTestIds: Array.isArray(profile.grantedTestIds) ? profile.grantedTestIds : base.grantedTestIds,
    subscriptionTier: isValidTier(profile.subscriptionTier) ? profile.subscriptionTier : base.subscriptionTier,
  };

  window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getDisplayName(name?: string, email?: string) {
  const safeName = (name || "").trim();
  if (safeName) return safeName;
  const safeEmail = (email || "").trim();
  return safeEmail ? safeEmail.split("@")[0].replace(/[._-]/g, " ") : "Student";
}
