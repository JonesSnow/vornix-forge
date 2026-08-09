export type AssessmentAnswers = Record<number, number>;

export type AssessmentResult = {
  score: number;
  level: number;
};

export type AssessmentStorage = {
  answers?: AssessmentAnswers;
  practicalAnswers?: AssessmentAnswers;
  score?: number;
  level?: number;
  result?: AssessmentResult;
};

export { type Question, type PracticalTask } from "@/lib/constants/content/assessment-questions";
export { type LevelDescription } from "@/lib/constants/content/assessment-levels";
