import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Participant,
  DebateTurn,
  DebateState,
  ViewMode,
  DebateContextType,
  Host,
} from "@/types/debate";
import { generateId } from "@/lib/utils";

const HOST_ID = "weird-science-host";

const initialState: DebateState = {
  title: "",
  participants: [],
  host: {
    id: HOST_ID,
    name: "Weird Science",
  },
  turns: [],
  currentTurnIndex: 0,
  isPlaying: false,
};

const DebateContext = createContext<DebateContextType | undefined>(undefined);

export function DebateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DebateState>(initialState);
  const [viewMode, setViewMode] = useState<ViewMode>("config");

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const addParticipant = useCallback(() => {
    const newParticipant: Participant = {
      id: generateId(),
      name: "",
    };
    setState((prev) => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
    }));
  }, []);

  const updateParticipant = useCallback(
    (id: string, updates: Partial<Omit<Participant, "id">>) => {
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) => {
          if (p.id !== id) return p;

          // Handle avatar URL creation/cleanup
          let newAvatarUrl = p.avatarUrl;
          if (updates.avatarFile !== undefined) {
            // Revoke old URL if exists
            if (p.avatarUrl) {
              URL.revokeObjectURL(p.avatarUrl);
            }
            // Create new URL if file exists
            newAvatarUrl = updates.avatarFile
              ? URL.createObjectURL(updates.avatarFile)
              : undefined;
          }

          return {
            ...p,
            ...updates,
            avatarUrl:
              updates.avatarFile !== undefined ? newAvatarUrl : p.avatarUrl,
          };
        }),
      }));
    },
    [],
  );

  const removeParticipant = useCallback((id: string) => {
    setState((prev) => {
      // Revoke avatar URL
      const participant = prev.participants.find((p) => p.id === id);
      if (participant?.avatarUrl) {
        URL.revokeObjectURL(participant.avatarUrl);
      }

      return {
        ...prev,
        participants: prev.participants.filter((p) => p.id !== id),
        // Clear participant from turns (but not host turns)
        turns: prev.turns.map((t) =>
          t.participantId === id && !t.isHostTurn
            ? { ...t, participantId: "" }
            : t,
        ),
      };
    });
  }, []);

  const updateHost = useCallback(
    (updates: Partial<Omit<Host, "id" | "name">>) => {
      setState((prev) => {
        // Handle avatar URL creation/cleanup
        let newAvatarUrl = prev.host.avatarUrl;
        if (updates.avatarFile !== undefined) {
          // Revoke old URL if exists
          if (prev.host.avatarUrl) {
            URL.revokeObjectURL(prev.host.avatarUrl);
          }
          // Create new URL if file exists
          newAvatarUrl = updates.avatarFile
            ? URL.createObjectURL(updates.avatarFile)
            : undefined;
        }

        return {
          ...prev,
          host: {
            ...prev.host,
            ...updates,
            avatarUrl:
              updates.avatarFile !== undefined
                ? newAvatarUrl
                : prev.host.avatarUrl,
          },
        };
      });
    },
    [],
  );

  const addTurn = useCallback(() => {
    const newTurn: DebateTurn = {
      id: generateId(),
      title: "",
      participantId: "",
      isHostTurn: false,
    };
    setState((prev) => ({
      ...prev,
      turns: [...prev.turns, newTurn],
    }));
  }, []);

  const addHostTurn = useCallback(() => {
    const newTurn: DebateTurn = {
      id: generateId(),
      title: "",
      participantId: HOST_ID,
      isHostTurn: true,
    };
    setState((prev) => ({
      ...prev,
      turns: [...prev.turns, newTurn],
    }));
  }, []);

  const updateTurn = useCallback(
    (id: string, updates: Partial<Omit<DebateTurn, "id">>) => {
      setState((prev) => ({
        ...prev,
        turns: prev.turns.map((t) => {
          if (t.id !== id) return t;

          // Handle audio URL creation/cleanup
          let newAudioUrl = t.audioUrl;
          if (updates.audioFile !== undefined) {
            // Revoke old URL if exists
            if (t.audioUrl) {
              URL.revokeObjectURL(t.audioUrl);
            }
            // Create new URL if file exists
            newAudioUrl = updates.audioFile
              ? URL.createObjectURL(updates.audioFile)
              : undefined;
          }

          // Handle video URL creation/cleanup
          let newVideoUrl = t.videoUrl;
          if (updates.videoFile !== undefined) {
            // Revoke old URL if exists
            if (t.videoUrl) {
              URL.revokeObjectURL(t.videoUrl);
            }
            // Create new URL if file exists
            newVideoUrl = updates.videoFile
              ? URL.createObjectURL(updates.videoFile)
              : undefined;
          }

          return {
            ...t,
            ...updates,
            audioUrl:
              updates.audioFile !== undefined ? newAudioUrl : t.audioUrl,
            videoUrl:
              updates.videoFile !== undefined ? newVideoUrl : t.videoUrl,
          };
        }),
      }));
    },
    [],
  );

  const removeTurn = useCallback((id: string) => {
    setState((prev) => {
      // Revoke audio and video URLs
      const turn = prev.turns.find((t) => t.id === id);
      if (turn?.audioUrl) {
        URL.revokeObjectURL(turn.audioUrl);
      }
      if (turn?.videoUrl) {
        URL.revokeObjectURL(turn.videoUrl);
      }

      return {
        ...prev,
        turns: prev.turns.filter((t) => t.id !== id),
      };
    });
  }, []);

  const reorderTurns = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      const oldIndex = prev.turns.findIndex((t) => t.id === activeId);
      const newIndex = prev.turns.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const newTurns = [...prev.turns];
      const [removed] = newTurns.splice(oldIndex, 1);
      newTurns.splice(newIndex, 0, removed);

      return {
        ...prev,
        turns: newTurns,
      };
    });
  }, []);

  const setCurrentTurnIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentTurnIndex: index }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  const nextTurn = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= prev.turns.length) {
        return { ...prev, isPlaying: false };
      }
      return { ...prev, currentTurnIndex: nextIndex };
    });
  }, []);

  const resetPlayback = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTurnIndex: 0,
      isPlaying: false,
    }));
  }, []);

  const canStartDebate = useMemo(() => {
    if (state.participants.length === 0) return false;
    if (state.turns.length === 0) return false;

    return state.turns.every((turn) => {
      // For host turns, need either video OR audio
      if (turn.isHostTurn) {
        return !!(turn.videoUrl || turn.audioUrl);
      }
      // For participant turns, check both participant and audio
      const hasParticipant =
        turn.participantId &&
        state.participants.some((p) => p.id === turn.participantId);
      const hasAudio = !!turn.audioUrl;
      return hasParticipant && hasAudio;
    });
  }, [state.participants, state.turns]);

  const value: DebateContextType = {
    state,
    viewMode,
    setViewMode,
    setTitle,
    addParticipant,
    updateParticipant,
    removeParticipant,
    updateHost,
    addTurn,
    addHostTurn,
    updateTurn,
    removeTurn,
    reorderTurns,
    setCurrentTurnIndex,
    setIsPlaying,
    nextTurn,
    resetPlayback,
    canStartDebate,
  };

  return (
    <DebateContext.Provider value={value}>{children}</DebateContext.Provider>
  );
}

export function useDebate(): DebateContextType {
  const context = useContext(DebateContext);
  if (context === undefined) {
    throw new Error("useDebate must be used within a DebateProvider");
  }
  return context;
}
