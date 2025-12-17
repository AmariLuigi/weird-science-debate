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

export interface DebateTurn {
  id: string;
  title: string;
  participantId: string; // Empty string for host turns
  isHostTurn: boolean; // True if this is a host speech
  audioFile?: File;
  audioUrl?: string;
  videoFile?: File; // Optional video file for this turn (host only)
  videoUrl?: string; // Optional video URL for this turn (host only)
  subtitleFile?: File;
  subtitles?: SubtitleCue[];
}

export interface DebateState {
  title: string;
  participants: Participant[];
  host: Host;
  turns: DebateTurn[];
  currentTurnIndex: number;
  isPlaying: boolean;
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
  reorderTurns: (activeId: string, overId: string) => void;
  setCurrentTurnIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  nextTurn: () => void;
  resetPlayback: () => void;
  canStartDebate: boolean;
}
