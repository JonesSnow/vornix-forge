export const STORAGE_KEYS = {
  onboardingAnswers: "vornix_onboarding_answers",
  onboardingComplete: "vornix_onboarding_complete",
  assessment: "vornix_assessment",
  assessmentComplete: "vornix_assessment_complete",
  dashboard: "vornix_dashboard_state",
} as const;

export type StorageKeys = typeof STORAGE_KEYS;
