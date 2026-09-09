import type { StudentSession } from "./types";

const now = new Date().toISOString();

export const starterSessions: StudentSession[] = [
  {
    id: "maya",
    name: "Maya",
    subject: "Quantum computing",
    confidence: 42,
    level: "Pattern Spotter",
    misconceptions: ["Confuses superposition with classical uncertainty", "Treats measurement as passive observation"],
    strengths: ["Uses concrete examples", "Asks clarifying questions early"],
    learningPattern: "Intuitive analogies first, then formal notation",
    recommendedNextTopic: "Superposition versus probability mixtures",
    teachingMove: "Use two contrastive examples before introducing Dirac notation",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "maya-1",
        role: "student",
        text: "I think a qubit is maybe both 0 and 1 until we check it, but I keep mixing that up with just not knowing the answer.",
        createdAt: now
      },
      {
        id: "maya-2",
        role: "tutor",
        text: "Good distinction to notice. Let us compare two cases: a hidden classical coin and a qubit state. What would make those two situations behave differently?",
        createdAt: now
      }
    ]
  },
  {
    id: "eli",
    name: "Eli",
    subject: "Quantum computing",
    confidence: 28,
    level: "Newcomer",
    misconceptions: ["Thinks quantum speedup means trying every answer at once", "Needs linear algebra prerequisites"],
    strengths: ["Comfortable with analogies", "Willing to state confusion"],
    learningPattern: "Needs concrete circuits before equations",
    recommendedNextTopic: "Classical bit versus qubit state",
    teachingMove: "Start with a one-qubit simulator and avoid formulas until vocabulary stabilizes",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "eli-1",
        role: "student",
        text: "I heard quantum computers try all answers at the same time, but I do not understand how measuring does not just give one random answer.",
        createdAt: now
      },
      {
        id: "eli-2",
        role: "tutor",
        text: "That is a common first model. We will refine it: quantum states can combine possibilities, but algorithms are designed so measurement makes useful answers more likely.",
        createdAt: now
      }
    ]
  },
  {
    id: "noor",
    name: "Noor",
    subject: "Quantum computing",
    confidence: 68,
    level: "Ready Builder",
    misconceptions: ["Sometimes skips normalization"],
    strengths: ["Tracks variables clearly", "Can explain amplitudes as state weights"],
    learningPattern: "Ready for formalism with boundary cases",
    recommendedNextTopic: "Single-qubit gates as matrix operations",
    teachingMove: "Ask for a worked Hadamard example and a measurement prediction",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "noor-1",
        role: "student",
        text: "A qubit state has amplitudes, and measurement probabilities come from their squared magnitudes. I am less sure why gates must be reversible.",
        createdAt: now
      },
      {
        id: "noor-2",
        role: "tutor",
        text: "Strong base. Next, connect gates to unitary matrices: they preserve total probability while rotating the state into a new basis.",
        createdAt: now
      }
    ]
  },
  {
    id: "maya-linear-algebra",
    name: "Maya",
    subject: "Linear algebra",
    confidence: 55,
    level: "Pattern Spotter",
    misconceptions: ["Confuses vector components with coordinates only", "Needs basis-change intuition"],
    strengths: ["Uses concrete examples", "Can compare geometric and numeric views"],
    learningPattern: "Intuitive analogies first, then formal notation",
    recommendedNextTopic: "Basis vectors and coordinate representations",
    teachingMove: "Connect arrows, ordered pairs, and basis choices before matrix operations",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "maya-la-1",
        role: "student",
        text: "I can picture vectors as arrows, but I get confused when the same vector has different coordinates in another basis.",
        createdAt: now
      },
      {
        id: "maya-la-2",
        role: "tutor",
        text: "That is exactly the bridge to build. The vector can stay the same while the measuring sticks, or basis vectors, change.",
        createdAt: now
      }
    ]
  },
  {
    id: "eli-probability",
    name: "Eli",
    subject: "Probability",
    confidence: 36,
    level: "Newcomer",
    misconceptions: ["Confuses probability with certainty after one outcome", "Needs base-rate intuition"],
    strengths: ["Comfortable with analogies", "Surfaces uncertainty productively"],
    learningPattern: "Needs concrete circuits before equations",
    recommendedNextTopic: "Sample spaces and conditional probability",
    teachingMove: "Use small counted examples before formulas",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "eli-prob-1",
        role: "student",
        text: "If something happened once, I keep wanting to say it is likely, but I know probability should count all possible outcomes.",
        createdAt: now
      },
      {
        id: "eli-prob-2",
        role: "tutor",
        text: "Good self-correction. Let us draw the full sample space first, then mark the outcome you observed.",
        createdAt: now
      }
    ]
  }
];
