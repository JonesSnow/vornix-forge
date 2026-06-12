feat: connect onboarding and assessment to Neon database

- Add Profile and Assessment tables to Prisma schema
- Create /api/profile POST endpoint to save onboarding answers
- Create /api/assessment POST endpoint to save assessment results
- Create /api/user-status GET endpoint to check user progress
- Update app/page.tsx to check database instead of localStorage
- Update OnboardingClient to POST profile data before redirecting
- Update AssessmentClient to POST assessment results before redirecting
- Keep localStorage as backup but database is source of truth
