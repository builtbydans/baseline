import type { AppMode } from "@/lib/types";

export interface AppCopy {
  modeName: string;
  otherModeName: string;
  dashboard: {
    kicker: string;
    title: string;
    subtitle: string;
    startCta: string;
    latestScore: string;
    clarityTrend: string;
    fillerTrend: string;
    sessionCount: string;
    chartTitle: string;
    chartDescription: string;
    claritySeries: string;
    fillerSeries: string;
    recentTitle: string;
    recentDescription: string;
    viewResults: string;
    durationLabel: string;
  };
  setup: {
    title: string;
    description: string;
    topicLabel: string;
    topicPlaceholder: string;
    frequencyLabel: string;
    durationLabel: string;
    hardwareTitle: string;
    cameraLabel: string;
    microphoneLabel: string;
    beginCta: string;
  };
  room: {
    title: string;
    recording: string;
    endSession: string;
    analyzingTitle: string;
    analyzingBody: string;
    trackingLabel: string;
  };
  results: {
    kicker: string;
    title: string;
    speechTitle: string;
    visualTitle: string;
    fillerWords: string;
    clarity: string;
    slurring: string;
    eyeContact: string;
    fidgeting: string;
    transcriptTitle: string;
    transcriptHint: string;
    feedbackTitle: string;
    backToHub: string;
    practiceAgain: string;
  };
  frequency: Record<"daily" | "twice-weekly" | "weekly", string>;
}

export const COPY: Record<AppMode, AppCopy> = {
  professional: {
    modeName: "Professional",
    otherModeName: "Clinical",
    dashboard: {
      kicker: "Progress Hub",
      title: "Interview fluency",
      subtitle:
        "Track clarity, filler-word reduction, and presence across practice sessions.",
      startCta: "Start New Session",
      latestScore: "Latest score",
      clarityTrend: "Clarity",
      fillerTrend: "Filler words",
      sessionCount: "Sessions",
      chartTitle: "Trend over time",
      chartDescription: "Clarity is rising while filler-word counts fall.",
      claritySeries: "Clarity %",
      fillerSeries: "Filler words",
      recentTitle: "Past sessions",
      recentDescription: "Interview and presentation practice history.",
      viewResults: "View assessment",
      durationLabel: "Duration",
    },
    setup: {
      title: "Session setup",
      description:
        "Choose a topic for interview practice. Clarity will simulate a live assessment.",
      topicLabel: "Subject / topic",
      topicPlaceholder: "e.g. Product sense interview, Q3 board update",
      frequencyLabel: "Practice frequency",
      durationLabel: "Target length",
      hardwareTitle: "Hardware check",
      cameraLabel: "Camera",
      microphoneLabel: "Microphone",
      beginCta: "Enter interview room",
    },
    room: {
      title: "Interview Room",
      recording: "Recording",
      endSession: "End Session",
      analyzingTitle: "Scoring your delivery",
      analyzingBody:
        "Simulating transcription, filler-word detection, and facial tracking analysis.",
      trackingLabel: "Facial tracking active",
    },
    results: {
      kicker: "Assessment",
      title: "Session results",
      speechTitle: "Speech",
      visualTitle: "Visual presence",
      fillerWords: "Filler words",
      clarity: "Clarity",
      slurring: "Articulation",
      eyeContact: "Eye contact",
      fidgeting: "Stillness",
      transcriptTitle: "Synced transcript",
      transcriptHint: "Filler words are marked in red. Select a word to jump the timeline.",
      feedbackTitle: "Actionable feedback",
      backToHub: "Back to hub",
      practiceAgain: "Practice again",
    },
    frequency: {
      daily: "Daily",
      "twice-weekly": "Twice a week",
      weekly: "Weekly",
    },
  },
  clinical: {
    modeName: "Clinical",
    otherModeName: "Professional",
    dashboard: {
      kicker: "Recovery Hub",
      title: "Speech recovery",
      subtitle:
        "Track clarity, disfluency reduction, and motor control across therapy sessions.",
      startCta: "Start Therapy Session",
      latestScore: "Latest score",
      clarityTrend: "Speech clarity",
      fillerTrend: "Disfluencies",
      sessionCount: "Sessions",
      chartTitle: "Recovery trend",
      chartDescription:
        "Clarity and gaze stability are improving week over week.",
      claritySeries: "Clarity %",
      fillerSeries: "Disfluencies",
      recentTitle: "Therapy history",
      recentDescription: "Sessions shared with you and your clinician.",
      viewResults: "View progress note",
      durationLabel: "Duration",
    },
    setup: {
      title: "Therapy session setup",
      description:
        "Set the speaking prompt and recovery goal. Hardware is checked before recording.",
      topicLabel: "Speaking prompt",
      topicPlaceholder: "e.g. Introduce yourself, describe your morning routine",
      frequencyLabel: "Therapy frequency",
      durationLabel: "Target length",
      hardwareTitle: "Hardware check",
      cameraLabel: "Camera",
      microphoneLabel: "Microphone",
      beginCta: "Enter therapy room",
    },
    room: {
      title: "Therapy Room",
      recording: "Recording",
      endSession: "End Session",
      analyzingTitle: "Analyzing this session",
      analyzingBody:
        "Simulating transcription, slurring detection, and facial-movement tracking.",
      trackingLabel: "Facial tracking active",
    },
    results: {
      kicker: "Progress note",
      title: "Session assessment",
      speechTitle: "Speech",
      visualTitle: "Motor & gaze",
      fillerWords: "Disfluencies",
      clarity: "Clarity",
      slurring: "Slurring control",
      eyeContact: "Gaze stability",
      fidgeting: "Movement control",
      transcriptTitle: "Synced transcript",
      transcriptHint:
        "Disfluencies are marked in red. Select a word to review that moment.",
      feedbackTitle: "Recommended next steps",
      backToHub: "Back to hub",
      practiceAgain: "Start another session",
    },
    frequency: {
      daily: "Daily home practice",
      "twice-weekly": "Twice-weekly therapy",
      weekly: "Weekly check-in",
    },
  },
};
