export interface Participant {
  id: string;
  name: string;
  avatarFile?: File;
  avatarUrl?: string;
}

export interface Host {
  id: string;
  name: string; // Always "Weird Science"
  avatarFile?: File;
  avatarUrl?: string;
}

export interface SubtitleCue {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface AudioTrack {
  id: string;
  audioFile?: File;
  audioUrl?: string;
  subtitleFile?: File;
  subtitles?: SubtitleCue[];
  duration?: number;
}

export type TurnType =
  | "intro_statement"
  | "defense"
  | "counter_attack"
  | "rebuttal"
  | "closing"
  | "host"
  | "custom";

export interface TurnTypeConfig {
  id: TurnType;
  label: string;
  expectedDuration: number;
  color: string;
}

export interface DebateTemplate {
  id: string;
  name: string;
  description: string;
  turnTypes: TurnTypeConfig[];
}

// Flow template step - defines a single step in a debate flow
export interface FlowTemplateStep {
  type: TurnType;
  participantSlot: "host" | "p1" | "p2";
  label: string;
}

// Flow template - defines a complete debate structure
export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  steps: FlowTemplateStep[];
}

export const TURN_TYPE_CONFIGS: Record<TurnType, TurnTypeConfig> = {
  intro_statement: {
    id: "intro_statement",
    label: "Intro Statement",
    expectedDuration: 180,
    color: "#3B82F6",
  },
  defense: {
    id: "defense",
    label: "Defense",
    expectedDuration: 120,
    color: "#22C55E",
  },
  counter_attack: {
    id: "counter_attack",
    label: "Counter Attack",
    expectedDuration: 120,
    color: "#EF4444",
  },
  rebuttal: {
    id: "rebuttal",
    label: "Rebuttal",
    expectedDuration: 90,
    color: "#F59E0B",
  },
  closing: {
    id: "closing",
    label: "Closing",
    expectedDuration: 60,
    color: "#8B5CF6",
  },
  host: {
    id: "host",
    label: "Host",
    expectedDuration: 30,
    color: "#14B8A6",
  },
  custom: {
    id: "custom",
    label: "Custom",
    expectedDuration: 0,
    color: "#6B7280",
  },
};

export const DEBATE_TEMPLATES: DebateTemplate[] = [
  {
    id: "classic",
    name: "Classic Debate",
    description: "Traditional format with opening statements, defense, counter attacks, and closing",
    turnTypes: [
      TURN_TYPE_CONFIGS.intro_statement,
      TURN_TYPE_CONFIGS.defense,
      TURN_TYPE_CONFIGS.counter_attack,
      TURN_TYPE_CONFIGS.closing,
    ],
  },
  {
    id: "opening_statements",
    name: "Opening Statements",
    description: "Extended opening statements with rebuttals",
    turnTypes: [
      { ...TURN_TYPE_CONFIGS.intro_statement, expectedDuration: 300 },
      { ...TURN_TYPE_CONFIGS.rebuttal, expectedDuration: 180 },
    ],
  },
  {
    id: "quick_fire",
    name: "Quick Fire",
    description: "Fast-paced format with shorter turn times",
    turnTypes: [
      { ...TURN_TYPE_CONFIGS.intro_statement, expectedDuration: 60 },
      { ...TURN_TYPE_CONFIGS.counter_attack, expectedDuration: 60 },
      { ...TURN_TYPE_CONFIGS.closing, expectedDuration: 30 },
    ],
  },
];

// Pre-built flow templates for quick setup
export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "hosted_debate",
    name: "Hosted Debate",
    description: "13-step broadcast-style flow with host segments, opening statements, rebuttals, and closing",
    steps: [
      // Phase 1: Introduction
      { type: "host", participantSlot: "host", label: "Host: Welcome & Topic" },
      { type: "intro_statement", participantSlot: "p1", label: "P1: Opening Statement" },
      { type: "intro_statement", participantSlot: "p2", label: "P2: Opening Statement" },
      // Phase 2: The Clash
      { type: "host", participantSlot: "host", label: "Host: Segue to Rebuttals" },
      { type: "counter_attack", participantSlot: "p1", label: "P1: Counter Attack" },
      { type: "defense", participantSlot: "p2", label: "P2: Defense" },
      { type: "counter_attack", participantSlot: "p2", label: "P2: Counter Attack" },
      { type: "defense", participantSlot: "p1", label: "P1: Defense" },
      // Phase 3: Conclusion
      { type: "host", participantSlot: "host", label: "Host: Move to Closing" },
      { type: "closing", participantSlot: "p1", label: "P1: Closing Argument" },
      { type: "closing", participantSlot: "p2", label: "P2: Closing Argument" },
      { type: "host", participantSlot: "host", label: "Host: Final Sign-off" },
    ],
  },
  {
    id: "simple_debate",
    name: "Simple Debate",
    description: "Quick 4-step debate with opening and closing only",
    steps: [
      { type: "intro_statement", participantSlot: "p1", label: "P1: Opening Statement" },
      { type: "intro_statement", participantSlot: "p2", label: "P2: Opening Statement" },
      { type: "closing", participantSlot: "p1", label: "P1: Closing" },
      { type: "closing", participantSlot: "p2", label: "P2: Closing" },
    ],
  },
];

export interface IntroOutroConfig {
  enableIntro: boolean;
  enableOutro: boolean;
  introMusicFile?: File;
  introMusicUrl?: string;
  outroMusicFile?: File;
  outroMusicUrl?: string;
  outroVideoFile?: File;
  outroVideoUrl?: string;
  transitionSoundFile?: File;
  transitionSoundUrl?: string;
  introMusicVolume: number;
  outroMusicVolume: number;
  transitionSoundVolume: number;
}

export interface DebateTurn {
  id: string;
  title: string;
  participantId: string;
  isHostTurn: boolean;
  turnType?: TurnType;
  duration?: number;
  audioFile?: File;
  audioUrl?: string;
  audioTracks?: AudioTrack[];
  videoFile?: File;
  videoUrl?: string;
  subtitleFile?: File;
  subtitles?: SubtitleCue[];
}

export type BroadcastPhase = "intro" | "debate" | "outro";

export type VideoFormat = "standard" | "shorts";

export interface DebateState {
  title: string;
  participants: Participant[];
  host: Host;
  turns: DebateTurn[];
  currentTurnIndex: number;
  isPlaying: boolean;
  template?: DebateTemplate;
  introOutroConfig: IntroOutroConfig;
  broadcastPhase: BroadcastPhase;
  videoFormat: VideoFormat;
}

export type ViewMode = "config" | "broadcast";

export interface DebateContextType {
  state: DebateState;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setTitle: (title: string) => void;
  addParticipant: () => void;
  updateParticipant: (
    id: string,
    updates: Partial<Omit<Participant, "id">>,
  ) => void;
  removeParticipant: (id: string) => void;
  updateHost: (updates: Partial<Omit<Host, "id" | "name">>) => void;
  addTurn: () => void;
  addHostTurn: () => void;
  updateTurn: (id: string, updates: Partial<Omit<DebateTurn, "id">>) => void;
  removeTurn: (id: string) => void;
  addAudioTrack: (turnId: string) => void;
  updateAudioTrack: (
    turnId: string,
    trackId: string,
    updates: Partial<Omit<AudioTrack, "id">>,
  ) => void;
  removeAudioTrack: (turnId: string, trackId: string) => void;
  reorderTurns: (activeId: string, overId: string) => void;
  setCurrentTurnIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  nextTurn: () => void;
  resetPlayback: () => void;
  setTemplate: (template: DebateTemplate | undefined) => void;
  loadFlowTemplate: (templateId: string) => void;
  updateIntroOutroConfig: (updates: Partial<IntroOutroConfig>) => void;
  setBroadcastPhase: (phase: BroadcastPhase) => void;
  setVideoFormat: (format: VideoFormat) => void;
  canStartDebate: boolean;
}
