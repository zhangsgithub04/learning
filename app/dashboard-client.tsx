"use client";

import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  Brain,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  UsersRound
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CohortInsight, StudentSession } from "@/lib/types";

const emptyCohort: CohortInsight = {
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
  reservedAnalysisDimensions: []
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: "The server returned an unreadable response." };
  }
}

function levelColor(level: StudentSession["level"]) {
  if (level === "Newcomer") return "levelNew";
  if (level === "Pattern Spotter") return "levelMid";
  return "levelReady";
}

export default function DashboardClient({ userName }: { userName: string }) {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [cohort, setCohort] = useState<CohortInsight>(emptyCohort);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("Quantum computing");
  const [newStudentName, setNewStudentName] = useState(userName);
  const [source, setSource] = useState<"openai" | "heuristic" | "idle">("idle");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeStudent = useMemo(
    () => students.find((student) => student.id === activeId) || students[0],
    [activeId, students]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setError("");
    setLoading(true);

    const [sessionsResponse, cohortResponse] = await Promise.all([fetch("/api/sessions"), fetch("/api/cohort")]);
    const sessionsData = await readJson(sessionsResponse);
    const cohortData = await readJson(cohortResponse);
    setLoading(false);

    if (!sessionsResponse.ok) {
      setError(sessionsData.error || "Could not load sessions.");
      return;
    }

    if (!cohortResponse.ok) {
      setError(cohortData.error || "Could not load cohort insight.");
      return;
    }

    const nextStudents = sessionsData.sessions || [];
    setStudents(nextStudents);
    setCohort(cohortData.insight || emptyCohort);
    setActiveId((current) => current || nextStudents[0]?.id || "");
  }

  async function refreshCohort(nextStudents?: StudentSession[]) {
    const response = await fetch("/api/cohort");
    const data = await readJson(response);
    if (response.ok) {
      setCohort(data.insight || emptyCohort);
      return;
    }

    if (nextStudents) {
      const average = nextStudents.length
        ? Math.round(nextStudents.reduce((sum, student) => sum + student.confidence, 0) / nextStudents.length)
        : 0;
      setCohort((current) => ({ ...current, average }));
    }
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || !activeStudent || busy) return;

    const text = draft.trim();
    setDraft("");
    setBusy(true);
    setError("");

    const response = await fetch(`/api/sessions/${activeStudent.id}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await readJson(response);
    setBusy(false);

    if (!response.ok) {
      setDraft(text);
      setError(data.error || "Could not process this learning turn.");
      return;
    }

    const updated = data.session as StudentSession;
    const nextStudents = students.map((student) => (student.id === updated.id ? updated : student));
    setStudents(nextStudents);
    setSource(data.source || "idle");
    await refreshCohort(nextStudents);
  }

  async function addStudent(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: newStudentName || `Student ${students.length + 1}`,
        subject
      })
    });
    const data = await readJson(response);
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not create a student session.");
      return;
    }

    const session = data.session as StudentSession;
    const nextStudents = [session, ...students];
    setStudents(nextStudents);
    setActiveId(session.id);
    setNewStudentName(userName);
    await refreshCohort(nextStudents);
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/auth";
  }

  return (
    <main className="appShell">
      <section className="studentPane" aria-label="Student chat and diagnosis">
        <header className="topBar">
          <div>
            <p className="eyebrow">Beginner Tutor Lab</p>
            <h1>Adaptive subject chat</h1>
          </div>
          <div className="systemStatus" aria-label="System status">
            <span>{userName}</span>
            <span>
              <Sparkles size={16} aria-hidden />
              {source === "openai" ? "OpenAI" : source === "heuristic" ? "Fallback" : "Ready"}
            </span>
            <button className="signOutButton" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <form className="setupBar" onSubmit={addStudent}>
          <label>
            <BookOpenCheck size={18} aria-hidden />
            <input
              aria-label="Subject matter"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject matter"
            />
          </label>
          <label>
            <GraduationCap size={18} aria-hidden />
            <input
              aria-label="New student name"
              value={newStudentName}
              onChange={(event) => setNewStudentName(event.target.value)}
              placeholder="New student name"
            />
          </label>
          <button type="submit" disabled={busy} aria-label="Add student">
            <MessageSquarePlus size={18} aria-hidden />
          </button>
        </form>

        {error ? (
          <div className="errorBanner">
            <AlertCircle size={18} aria-hidden />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="studentStrip" aria-label="Student profiles">
          {loading ? (
            <div className="loadingLine">
              <Loader2 size={18} aria-hidden />
              Loading sessions
            </div>
          ) : (
            students.map((student) => (
              <button
                className={student.id === activeStudent?.id ? "studentTab active" : "studentTab"}
                key={student.id}
                onClick={() => setActiveId(student.id)}
                type="button"
              >
                <GraduationCap size={16} aria-hidden />
                <span>{student.name}</span>
                <small>{student.confidence}%</small>
              </button>
            ))
          )}
        </div>

        {activeStudent ? (
          <>
            <article className="learnerHeader">
              <div>
                <p className="eyebrow">{activeStudent.subject}</p>
                <h2>{activeStudent.name}</h2>
              </div>
              <div className={`levelBadge ${levelColor(activeStudent.level)}`}>
                <Brain size={18} aria-hidden />
                {activeStudent.level}
              </div>
            </article>

            <section className="chatWindow" aria-label={`Chat with ${activeStudent.name}`}>
              {activeStudent.messages.map((message) => (
                <div className={`message ${message.role}`} key={message.id}>
                  <span>{message.role === "student" ? activeStudent.name : "GPT Tutor"}</span>
                  <p>{message.text}</p>
                </div>
              ))}
              {busy ? (
                <div className="message tutor pending">
                  <span>GPT Tutor</span>
                  <p>Reading the student evidence...</p>
                </div>
              ) : null}
            </section>

            <form className="composer" onSubmit={submitMessage}>
              <textarea
                aria-label="Student message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a question, explain the idea, or try an example..."
                rows={3}
              />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">
                {busy ? <Loader2 size={18} aria-hidden /> : <Send size={18} aria-hidden />}
              </button>
            </form>
          </>
        ) : (
          <section className="emptyState">
            <h2>No sessions yet</h2>
            <p>Add a student to begin collecting learning-behavior evidence.</p>
          </section>
        )}
      </section>

      <aside className="insightPane" aria-label="Classroom pattern analysis">
        <section className="teacherHeader">
          <p className="eyebrow">Teacher View</p>
          <h2>Learning order and patterns</h2>
          <p>
            Student chats are saved, analyzed, and converted into cohort-level evidence for topic ramping decisions.
          </p>
        </section>

        <section className="metricGrid">
          <div className="metric">
            <UsersRound size={20} aria-hidden />
            <span>{students.length}</span>
            <small>students</small>
          </div>
          <div className="metric">
            <BarChart3 size={20} aria-hidden />
            <span>{cohort.average}%</span>
            <small>avg readiness</small>
          </div>
          <div className="metric">
            <Sparkles size={20} aria-hidden />
            <span>{cohort.ready}</span>
            <small>ready builders</small>
          </div>
        </section>

        <section className="levelStack" aria-label="Student readiness distribution">
          <div style={{ width: `${Math.max(cohort.newcomer * 18, 12)}%` }} className="newcomers">
            {cohort.newcomer}
          </div>
          <div style={{ width: `${Math.max(cohort.middle * 18, 12)}%` }} className="middle">
            {cohort.middle}
          </div>
          <div style={{ width: `${Math.max(cohort.ready * 18, 12)}%` }} className="ready">
            {cohort.ready}
          </div>
        </section>

        <section className="patternPanel">
          <div className="panelTitle">
            <Lightbulb size={18} aria-hidden />
            <h3>Recommended teaching moves</h3>
          </div>
          {(cohort.teachingMoves.length
            ? cohort.teachingMoves
            : ["Ask each student to explain the target concept in their own words before instruction"]
          ).map((move) => (
            <div className="recommendation" key={move}>
              <strong>{move}</strong>
              <p>Evidence from chat turns can be used to decide whether to slow down, add prerequisites, or advance.</p>
            </div>
          ))}
        </section>

        <section className="patternPanel">
          <div className="panelTitle">
            <ChevronRight size={18} aria-hidden />
            <h3>Common friction points</h3>
          </div>
          {(cohort.commonMisconceptions.length ? cohort.commonMisconceptions : [["Collect more chat evidence", 1]]).map(
            ([item, count]) => (
              <div className="friction" key={item}>
                <span>{count}x</span>
                <p>{item}</p>
              </div>
            )
          )}
        </section>

        <section className="patternPanel">
          <div className="panelTitle">
            <ChevronRight size={18} aria-hidden />
            <h3>Topic ramp candidates</h3>
          </div>
          {(cohort.nextTopics.length ? cohort.nextTopics : ["Initial concept inventory"]).map((topic) => (
            <div className="friction" key={topic}>
              <span>Next</span>
              <p>{topic}</p>
            </div>
          ))}
        </section>

        <section className="patternPanel dimensionPanel">
          <div className="panelTitle">
            <Brain size={18} aria-hidden />
            <h3>One student across subjects</h3>
          </div>
          {(cohort.studentAcrossSubjects.length
            ? cohort.studentAcrossSubjects
            : [
                {
                  studentName: "Add more sessions",
                  subjects: ["At least two subjects"],
                  averageConfidence: 0,
                  recurringStrengths: [],
                  recurringMisconceptions: [],
                  patternSummary: "Create multiple subject sessions for the same student name to reveal cross-domain habits.",
                  nextStudyMove: "Compare whether the same scaffolds work in each subject."
                }
              ]
          ).map((pattern) => (
            <article className="dimensionCard" key={`${pattern.studentName}-${pattern.subjects.join("-")}`}>
              <div className="dimensionTop">
                <strong>{pattern.studentName}</strong>
                <span>{pattern.averageConfidence}%</span>
              </div>
              <p>{pattern.subjects.join(" / ")}</p>
              <p>{pattern.patternSummary}</p>
              <div className="miniTags">
                {pattern.recurringStrengths.slice(0, 2).map(([item, count]) => (
                  <span key={item}>+ {item} ({count})</span>
                ))}
                {pattern.recurringMisconceptions.slice(0, 2).map(([item, count]) => (
                  <span key={item}>! {item} ({count})</span>
                ))}
              </div>
              <small>{pattern.nextStudyMove}</small>
            </article>
          ))}
        </section>

        <section className="patternPanel dimensionPanel">
          <div className="panelTitle">
            <UsersRound size={18} aria-hidden />
            <h3>One subject across students</h3>
          </div>
          {(cohort.subjectAcrossStudents.length
            ? cohort.subjectAcrossStudents
            : [
                {
                  subject: "Add student sessions",
                  studentCount: 0,
                  averageConfidence: 0,
                  levelMix: { newcomer: 0, middle: 0, ready: 0 },
                  commonMisconceptions: [],
                  commonLearningPatterns: [],
                  suggestedRamp: ["Initial concept inventory"]
                }
              ]
          ).map((pattern) => (
            <article className="dimensionCard" key={pattern.subject}>
              <div className="dimensionTop">
                <strong>{pattern.subject}</strong>
                <span>{pattern.averageConfidence}%</span>
              </div>
              <p>
                {pattern.studentCount} students: {pattern.levelMix.newcomer} newcomer, {pattern.levelMix.middle} middle,{" "}
                {pattern.levelMix.ready} ready
              </p>
              <div className="miniTags">
                {pattern.commonMisconceptions.slice(0, 2).map(([item, count]) => (
                  <span key={item}>! {item} ({count})</span>
                ))}
                {pattern.commonLearningPatterns.slice(0, 2).map(([item, count]) => (
                  <span key={item}>~ {item} ({count})</span>
                ))}
              </div>
              <small>Ramp: {pattern.suggestedRamp.join(" -> ")}</small>
            </article>
          ))}
        </section>

        <section className="patternPanel">
          <div className="panelTitle">
            <BarChart3 size={18} aria-hidden />
            <h3>Reserved analysis types</h3>
          </div>
          <div className="analysisGrid">
            {(cohort.reservedAnalysisDimensions.length
              ? cohort.reservedAnalysisDimensions
              : ["Prerequisite graph", "Cognitive load", "Affect", "Transfer"]
            ).map((dimension) => (
              <span key={dimension}>{dimension}</span>
            ))}
          </div>
        </section>

        {activeStudent ? (
          <section className="profileEvidence">
            <h3>Current student evidence</h3>
            <div>
              <strong>Strengths</strong>
              {activeStudent.strengths.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div>
              <strong>Watch points</strong>
              {activeStudent.misconceptions.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div className="wideEvidence">
              <strong>Learning pattern</strong>
              <p>{activeStudent.learningPattern}</p>
            </div>
          </section>
        ) : null}
      </aside>
    </main>
  );
}
