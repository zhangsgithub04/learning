import OpenAI from "openai";
import type {
  CohortInsight,
  LearningEvidence,
  Level,
  Message,
  StudentAcrossSubjectsPattern,
  StudentSession,
  SubjectAcrossStudentsPattern
} from "./types";

const conceptSignals = [
  { label: "Uses precise terms", terms: ["amplitude", "basis", "state", "gate", "measurement", "unitary", "qubit"] },
  { label: "Explains cause and effect", terms: ["because", "therefore", "so", "leads to", "means"] },
  { label: "Grounds ideas in examples", terms: ["example", "like", "such as", "imagine", "case"] },
  { label: "Transfers to a new case", terms: ["another", "different", "similar", "apply", "transfer"] }
];

const confusionTerms = ["confused", "mix", "stuck", "lost", "guess", "random", "all answers", "both 0 and 1"];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function classify(confidence: number): Level {
  if (confidence < 40) return "Newcomer";
  if (confidence < 70) return "Pattern Spotter";
  return "Ready Builder";
}

function countItems(items: string[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

const reservedAnalysisDimensions = [
  "Prerequisite dependency graph",
  "Cognitive load trend",
  "Affect and motivation state",
  "Retrieval strength over time",
  "Transfer to new problems",
  "Hint sensitivity and scaffold fading",
  "Peer-teaching readiness",
  "Equity and accessibility signals"
];

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFor(item);
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return groups;
}

function buildStudentAcrossSubjects(sessions: StudentSession[]): StudentAcrossSubjectsPattern[] {
  return Array.from(groupBy(sessions, (session) => session.name).entries())
    .map(([studentName, studentSessions]) => {
      const subjects = Array.from(new Set(studentSessions.map((session) => session.subject)));
      const averageConfidence = Math.round(
        studentSessions.reduce((sum, session) => sum + session.confidence, 0) / studentSessions.length
      );
      const recurringStrengths = countItems(studentSessions.flatMap((session) => session.strengths)).slice(0, 4);
      const recurringMisconceptions = countItems(studentSessions.flatMap((session) => session.misconceptions)).slice(0, 4);
      const lowSubjects = studentSessions
        .filter((session) => session.confidence < averageConfidence)
        .map((session) => session.subject);
      const patternSummary =
        subjects.length > 1
          ? `${studentName} has ${subjects.length} subject profiles; compare recurring strengths against subject-specific gaps.`
          : `${studentName} has one subject profile; add another subject to reveal cross-domain learning habits.`;
      const nextStudyMove = lowSubjects.length
        ? `Revisit ${Array.from(new Set(lowSubjects)).slice(0, 2).join(" and ")} with the same explanation format that worked elsewhere.`
        : "Add a second subject session or a transfer task to test whether the pattern generalizes.";

      return {
        studentName,
        subjects,
        averageConfidence,
        recurringStrengths,
        recurringMisconceptions,
        patternSummary,
        nextStudyMove
      };
    })
    .sort((a, b) => b.subjects.length - a.subjects.length || a.studentName.localeCompare(b.studentName))
    .slice(0, 6);
}

function buildSubjectAcrossStudents(sessions: StudentSession[]): SubjectAcrossStudentsPattern[] {
  return Array.from(groupBy(sessions, (session) => session.subject).entries())
    .map(([subject, subjectSessions]) => {
      const averageConfidence = Math.round(
        subjectSessions.reduce((sum, session) => sum + session.confidence, 0) / subjectSessions.length
      );
      const commonMisconceptions = countItems(subjectSessions.flatMap((session) => session.misconceptions)).slice(0, 4);
      const commonLearningPatterns = countItems(subjectSessions.map((session) => session.learningPattern)).slice(0, 4);
      const levelMix = {
        newcomer: subjectSessions.filter((session) => session.level === "Newcomer").length,
        middle: subjectSessions.filter((session) => session.level === "Pattern Spotter").length,
        ready: subjectSessions.filter((session) => session.level === "Ready Builder").length
      };
      const suggestedRamp = Array.from(new Set(subjectSessions.map((session) => session.recommendedNextTopic))).slice(0, 5);

      return {
        subject,
        studentCount: subjectSessions.length,
        averageConfidence,
        levelMix,
        commonMisconceptions,
        commonLearningPatterns,
        suggestedRamp
      };
    })
    .sort((a, b) => b.studentCount - a.studentCount || a.subject.localeCompare(b.subject))
    .slice(0, 6);
}

export function buildCohortInsight(sessions: StudentSession[]): CohortInsight {
  if (sessions.length === 0) {
    return {
      average: 0,
      ready: 0,
      middle: 0,
      newcomer: 0,
      commonMisconceptions: [],
      commonPatterns: [],
      teachingMoves: [],
      nextTopics: [],
      studentAcrossSubjects: [],
      subjectAcrossStudents: [],
      reservedAnalysisDimensions
    };
  }

  return {
    average: Math.round(sessions.reduce((sum, student) => sum + student.confidence, 0) / sessions.length),
    ready: sessions.filter((student) => student.level === "Ready Builder").length,
    middle: sessions.filter((student) => student.level === "Pattern Spotter").length,
    newcomer: sessions.filter((student) => student.level === "Newcomer").length,
    commonMisconceptions: countItems(sessions.flatMap((student) => student.misconceptions)).slice(0, 5),
    commonPatterns: countItems(sessions.map((student) => student.learningPattern)).slice(0, 5),
    teachingMoves: Array.from(new Set(sessions.map((student) => student.teachingMove))).slice(0, 4),
    nextTopics: Array.from(new Set(sessions.map((student) => student.recommendedNextTopic))).slice(0, 4),
    studentAcrossSubjects: buildStudentAcrossSubjects(sessions),
    subjectAcrossStudents: buildSubjectAcrossStudents(sessions),
    reservedAnalysisDimensions
  };
}

function heuristicEvidence(session: StudentSession, text: string): LearningEvidence & { tutorReply: string } {
  const lower = text.toLowerCase();
  const matchedSignals = conceptSignals.filter((signal) => signal.terms.some((term) => lower.includes(term)));
  const confusion = confusionTerms.filter((term) => lower.includes(term));
  const asksQuestion = lower.includes("?") || lower.startsWith("why") || lower.startsWith("how");
  const explanationLength = text.trim().split(/\s+/).filter(Boolean).length;
  const confidence = clamp(
    session.confidence + matchedSignals.length * 6 + (asksQuestion ? 3 : 0) + (explanationLength > 22 ? 5 : 0) - confusion.length * 4
  );
  const strengths = new Set(session.strengths);
  const misconceptions = new Set(session.misconceptions);

  matchedSignals.forEach((match) => strengths.add(match.label));
  if (asksQuestion) strengths.add("Surfaces uncertainty productively");
  if (lower.includes("all answers")) misconceptions.add("May overstate quantum parallelism");
  if (lower.includes("random")) misconceptions.add("Needs contrast between randomness and amplitude-driven probability");
  if (lower.includes("both 0 and 1")) misconceptions.add("Needs superposition versus hidden classical state distinction");

  const level = classify(confidence);
  const teachingMove =
    level === "Newcomer"
      ? "Use a visible one-qubit example before symbolic notation"
      : level === "Pattern Spotter"
        ? "Compare a classical probability mixture with a superposition"
        : "Ask the student to predict a gate outcome and explain the boundary case";
  const recommendedNextTopic =
    level === "Newcomer"
      ? "Classical bit versus qubit state"
      : level === "Pattern Spotter"
        ? "Measurement probabilities from amplitudes"
        : "Single-qubit gates as matrix operations";

  return {
    confidence,
    level,
    misconceptions: Array.from(misconceptions).slice(-6),
    strengths: Array.from(strengths).slice(-6),
    learningPattern: level === "Newcomer" ? "Needs concrete examples first" : level === "Pattern Spotter" ? "Can compare cases with scaffolding" : "Ready for formal reasoning",
    recommendedNextTopic,
    teachingMove,
    tutorReply: `${teachingMove}. For ${session.subject}, try this next: ${recommendedNextTopic}. In one or two sentences, explain what changes when measurement happens.`
  };
}

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tutorReply: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    level: { type: "string", enum: ["Newcomer", "Pattern Spotter", "Ready Builder"] },
    misconceptions: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    learningPattern: { type: "string" },
    recommendedNextTopic: { type: "string" },
    teachingMove: { type: "string" }
  },
  required: [
    "tutorReply",
    "confidence",
    "level",
    "misconceptions",
    "strengths",
    "learningPattern",
    "recommendedNextTopic",
    "teachingMove"
  ]
} as const;

export async function analyzeLearningTurn(
  session: StudentSession,
  studentText: string
): Promise<LearningEvidence & { tutorReply: string; source: "openai" | "heuristic" }> {
  if (!process.env.OPENAI_API_KEY) {
    return { ...heuristicEvidence(session, studentText), source: "heuristic" };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const recentMessages = session.messages
      .slice(-8)
      .map((message: Message) => `${message.role.toUpperCase()}: ${message.text}`)
      .join("\n");

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are an expert beginner tutor and learning scientist. Tutor gently, diagnose conceptual readiness, and produce structured evidence for a teacher dashboard. Do not pretend certainty; infer from the student's words."
        },
        {
          role: "user",
          content: `Subject: ${session.subject}
Student: ${session.name}
Previous learner evidence:
- Confidence: ${session.confidence}
- Level: ${session.level}
- Misconceptions: ${session.misconceptions.join("; ")}
- Strengths: ${session.strengths.join("; ")}
- Learning pattern: ${session.learningPattern}

Recent chat:
${recentMessages}

New student message:
${studentText}

Return a short tutor reply and updated teacher-facing evidence. Keep arrays to 3-6 concise items.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "learning_turn",
          schema: evidenceSchema,
          strict: true
        }
      }
    });

    const output = JSON.parse(response.output_text) as LearningEvidence & { tutorReply: string };
    return {
      ...output,
      confidence: clamp(Math.round(output.confidence)),
      level: classify(output.confidence),
      source: "openai"
    };
  } catch (error) {
    console.error("OpenAI analysis failed; using heuristic fallback.", error);
    return { ...heuristicEvidence(session, studentText), source: "heuristic" };
  }
}
