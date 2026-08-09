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

export { type Question, type PracticalTask } from "@/constants/content/assessment-questions";
export { type LevelDescription } from "@/constants/content/assessment-levels";
