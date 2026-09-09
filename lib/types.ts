export type Role = "student" | "tutor";

export type Level = "Newcomer" | "Pattern Spotter" | "Ready Builder";

export type Message = {
  id: string;
  role: Role;
  text: string;
  createdAt: string;
};

export type LearningEvidence = {
  confidence: number;
  level: Level;
  misconceptions: string[];
  strengths: string[];
  learningPattern: string;
  recommendedNextTopic: string;
  teachingMove: string;
};

export type StudentSession = {
  id: string;
  name: string;
  subject: string;
  confidence: number;
  level: Level;
  misconceptions: string[];
  strengths: string[];
  learningPattern: string;
  recommendedNextTopic: string;
  teachingMove: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type StudentAcrossSubjectsPattern = {
  studentName: string;
  subjects: string[];
  averageConfidence: number;
  recurringStrengths: [string, number][];
  recurringMisconceptions: [string, number][];
  patternSummary: string;
  nextStudyMove: string;
};

export type SubjectAcrossStudentsPattern = {
  subject: string;
  studentCount: number;
  averageConfidence: number;
  levelMix: {
    newcomer: number;
    middle: number;
    ready: number;
  };
  commonMisconceptions: [string, number][];
  commonLearningPatterns: [string, number][];
  suggestedRamp: string[];
};

export type CohortInsight = {
  average: number;
  ready: number;
  middle: number;
  newcomer: number;
  commonMisconceptions: [string, number][];
  commonPatterns: [string, number][];
  teachingMoves: string[];
  nextTopics: string[];
  studentAcrossSubjects: StudentAcrossSubjectsPattern[];
  subjectAcrossStudents: SubjectAcrossStudentsPattern[];
  reservedAnalysisDimensions: string[];
};
