import { ObjectId, type Document } from "mongodb";
import { buildCohortInsight } from "./learning";
import { getDatabase, hasMongoConfig } from "./mongodb";
import { starterSessions } from "./seed";
import type { CohortInsight, StudentSession } from "./types";

const memorySessions = new Map<string, StudentSession>(starterSessions.map((session) => [session.id, session]));

type SessionDocument = Omit<StudentSession, "id"> & {
  _id?: ObjectId;
};

function fromDocument(document: Document): StudentSession {
  return {
    id: String(document._id),
    name: document.name,
    subject: document.subject,
    confidence: document.confidence,
    level: document.level,
    misconceptions: document.misconceptions,
    strengths: document.strengths,
    learningPattern: document.learningPattern,
    recommendedNextTopic: document.recommendedNextTopic,
    teachingMove: document.teachingMove,
    messages: document.messages,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

async function collection() {
  const db = await getDatabase();
  return db.collection<SessionDocument>("student_sessions");
}

export async function listSessions(): Promise<{ sessions: StudentSession[]; storage: "mongodb" | "memory" }> {
  if (!hasMongoConfig()) {
    return {
      sessions: Array.from(memorySessions.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      storage: "memory"
    };
  }

  const sessions = await (await collection()).find({}).sort({ updatedAt: -1 }).toArray();
  return { sessions: sessions.map(fromDocument), storage: "mongodb" };
}

export async function createSession(name: string, subject: string): Promise<StudentSession> {
  const now = new Date().toISOString();
  const session: StudentSession = {
    id: new ObjectId().toHexString(),
    name: name.trim() || "New student",
    subject: subject.trim() || "Quantum computing",
    confidence: 18,
    level: "Newcomer",
    misconceptions: ["Baseline unknown"],
    strengths: ["New profile"],
    learningPattern: "Insufficient evidence",
    recommendedNextTopic: "Initial concept inventory",
    teachingMove: "Ask the student to explain what they already believe",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: new ObjectId().toHexString(),
        role: "tutor",
        text: `Hi. I will learn how you think about ${subject || "this subject"} from your explanations, examples, and questions. Start with what you already believe, even if it feels rough.`,
        createdAt: now
      }
    ]
  };

  if (!hasMongoConfig()) {
    memorySessions.set(session.id, session);
    return session;
  }

  const { id, ...document } = session;
  const result = await (await collection()).insertOne({ ...document, _id: new ObjectId(id) });
  return { ...session, id: result.insertedId.toHexString() };
}

export async function getSession(id: string): Promise<StudentSession | null> {
  if (!hasMongoConfig()) {
    return memorySessions.get(id) || null;
  }

  if (!ObjectId.isValid(id)) return null;
  const session = await (await collection()).findOne({ _id: new ObjectId(id) });
  return session ? fromDocument(session) : null;
}

export async function saveSession(session: StudentSession): Promise<StudentSession> {
  const nextSession = { ...session, updatedAt: new Date().toISOString() };

  if (!hasMongoConfig()) {
    memorySessions.set(nextSession.id, nextSession);
    return nextSession;
  }

  const { id, ...document } = nextSession;
  await (await collection()).replaceOne({ _id: new ObjectId(id) }, document, { upsert: true });
  return nextSession;
}

export async function cohortInsight(): Promise<{ insight: CohortInsight; storage: "mongodb" | "memory" }> {
  const { sessions, storage } = await listSessions();
  return { insight: buildCohortInsight(sessions), storage };
}
