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
  AudioTrack,
  DebateTemplate,
  IntroOutroConfig,
  BroadcastPhase,
  VideoFormat,
} from "@/types/debate";
import { generateId } from "@/lib/utils";

const HOST_ID = "weird-science-host";

const defaultIntroOutroConfig: IntroOutroConfig = {
  enableIntro: true,
  enableOutro: true,
  introMusicVolume: 0.3,
  outroMusicVolume: 0.3,
  transitionSoundVolume: 0.5,
  outroVideoUrl: "/HOST OUTRO.mov",
};

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
  template: undefined,
  introOutroConfig: defaultIntroOutroConfig,
  broadcastPhase: "intro",
  videoFormat: "standard",
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
      audioTracks: [],
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
      audioTracks: [],
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
      // Revoke all audio track URLs
      turn?.audioTracks?.forEach((track) => {
        if (track.audioUrl) {
          URL.revokeObjectURL(track.audioUrl);
        }
      });

      return {
        ...prev,
        turns: prev.turns.filter((t) => t.id !== id),
      };
    });
  }, []);

  const addAudioTrack = useCallback((turnId: string) => {
    const newTrack: AudioTrack = {
      id: generateId(),
    };
    setState((prev) => ({
      ...prev,
      turns: prev.turns.map((t) => {
        if (t.id !== turnId) return t;
        return {
          ...t,
          audioTracks: [...(t.audioTracks || []), newTrack],
        };
      }),
    }));
  }, []);

  const updateAudioTrack = useCallback(
    (
      turnId: string,
      trackId: string,
      updates: Partial<Omit<AudioTrack, "id">>,
    ) => {
      setState((prev) => ({
        ...prev,
        turns: prev.turns.map((t) => {
          if (t.id !== turnId) return t;
          return {
            ...t,
            audioTracks: (t.audioTracks || []).map((track) => {
              if (track.id !== trackId) return track;

              // Handle audio URL creation/cleanup
              let newAudioUrl = track.audioUrl;
              if (updates.audioFile !== undefined) {
                // Revoke old URL if exists
                if (track.audioUrl) {
                  URL.revokeObjectURL(track.audioUrl);
                }
                // Create new URL if file exists
                newAudioUrl = updates.audioFile
                  ? URL.createObjectURL(updates.audioFile)
                  : undefined;
              }

              return {
                ...track,
                ...updates,
                audioUrl:
                  updates.audioFile !== undefined
                    ? newAudioUrl
                    : track.audioUrl,
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  const removeAudioTrack = useCallback((turnId: string, trackId: string) => {
    setState((prev) => ({
      ...prev,
      turns: prev.turns.map((t) => {
        if (t.id !== turnId) return t;

        // Find and revoke the audio URL before removing
        const track = t.audioTracks?.find((tr) => tr.id === trackId);
        if (track?.audioUrl) {
          URL.revokeObjectURL(track.audioUrl);
        }

        return {
          ...t,
          audioTracks: (t.audioTracks || []).filter((tr) => tr.id !== trackId),
        };
      }),
    }));
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
      broadcastPhase: prev.introOutroConfig.enableIntro ? "intro" : "debate",
    }));
  }, []);

  const setTemplate = useCallback((template: DebateTemplate | undefined) => {
    setState((prev) => ({ ...prev, template }));
  }, []);

  const loadFlowTemplate = useCallback((templateId: string) => {
    // Import FLOW_TEMPLATES dynamically to avoid circular dependency
    import("@/types/debate").then(({ FLOW_TEMPLATES, TURN_TYPE_CONFIGS }) => {
      const template = FLOW_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      setState((prev) => {
        // Map participant slots to actual participant IDs
        const p1 = prev.participants[0]?.id || "";
        const p2 = prev.participants[1]?.id || "";
        const participantMap: Record<string, string> = {
          host: HOST_ID,
          p1,
          p2,
        };

        // Generate turns from template steps
        const newTurns: DebateTurn[] = template.steps.map((step) => {
          const isHost = step.participantSlot === "host";
          const participantId = participantMap[step.participantSlot] || "";
          const turnTypeConfig = TURN_TYPE_CONFIGS[step.type];

          return {
            id: generateId(),
            title: step.label,
            participantId,
            isHostTurn: isHost,
            turnType: step.type,
            duration: turnTypeConfig?.expectedDuration,
            audioTracks: [],
            // Auto-populate video URL from template defaults
            videoUrl: step.defaultVideoUrl,
          };
        });

        return {
          ...prev,
          turns: newTurns,
        };
      });
    });
  }, []);

  const updateIntroOutroConfig = useCallback(
    (updates: Partial<IntroOutroConfig>) => {
      setState((prev) => {
        let newIntroMusicUrl = prev.introOutroConfig.introMusicUrl;
        if (updates.introMusicFile !== undefined) {
          if (prev.introOutroConfig.introMusicUrl) {
            URL.revokeObjectURL(prev.introOutroConfig.introMusicUrl);
          }
          newIntroMusicUrl = updates.introMusicFile
            ? URL.createObjectURL(updates.introMusicFile)
            : undefined;
        }

        let newOutroMusicUrl = prev.introOutroConfig.outroMusicUrl;
        if (updates.outroMusicFile !== undefined) {
          if (prev.introOutroConfig.outroMusicUrl) {
            URL.revokeObjectURL(prev.introOutroConfig.outroMusicUrl);
          }
          newOutroMusicUrl = updates.outroMusicFile
            ? URL.createObjectURL(updates.outroMusicFile)
            : undefined;
        }

        let newTransitionSoundUrl = prev.introOutroConfig.transitionSoundUrl;
        if (updates.transitionSoundFile !== undefined) {
          if (prev.introOutroConfig.transitionSoundUrl) {
            URL.revokeObjectURL(prev.introOutroConfig.transitionSoundUrl);
          }
          newTransitionSoundUrl = updates.transitionSoundFile
            ? URL.createObjectURL(updates.transitionSoundFile)
            : undefined;
        }

        let newOutroVideoUrl = prev.introOutroConfig.outroVideoUrl;
        if (updates.outroVideoFile !== undefined) {
          if (prev.introOutroConfig.outroVideoUrl) {
            URL.revokeObjectURL(prev.introOutroConfig.outroVideoUrl);
          }
          newOutroVideoUrl = updates.outroVideoFile
            ? URL.createObjectURL(updates.outroVideoFile)
            : undefined;
        }

        return {
          ...prev,
          introOutroConfig: {
            ...prev.introOutroConfig,
            ...updates,
            introMusicUrl:
              updates.introMusicFile !== undefined
                ? newIntroMusicUrl
                : prev.introOutroConfig.introMusicUrl,
            outroMusicUrl:
              updates.outroMusicFile !== undefined
                ? newOutroMusicUrl
                : prev.introOutroConfig.outroMusicUrl,
            outroVideoUrl:
              updates.outroVideoFile !== undefined
                ? newOutroVideoUrl
                : prev.introOutroConfig.outroVideoUrl,
            transitionSoundUrl:
              updates.transitionSoundFile !== undefined
                ? newTransitionSoundUrl
                : prev.introOutroConfig.transitionSoundUrl,
          },
        };
      });
    },
    [],
  );

  const setBroadcastPhase = useCallback((phase: BroadcastPhase) => {
    setState((prev) => ({ ...prev, broadcastPhase: phase }));
  }, []);

  const setVideoFormat = useCallback((format: VideoFormat) => {
    setState((prev) => ({ ...prev, videoFormat: format }));
  }, []);

  // Helper function to get all audio URLs for a turn (legacy + tracks)
  const getTurnAudioUrls = (turn: DebateTurn): string[] => {
    const urls: string[] = [];
    // Legacy single audio
    if (turn.audioUrl) {
      urls.push(turn.audioUrl);
    }
    // Audio tracks
    if (turn.audioTracks) {
      turn.audioTracks.forEach((track) => {
        if (track.audioUrl) {
          urls.push(track.audioUrl);
        }
      });
    }
    return urls;
  };

  const canStartDebate = useMemo(() => {
    if (state.participants.length === 0) return false;
    if (state.turns.length === 0) return false;

    return state.turns.every((turn) => {
      // Get all audio URLs for this turn
      const audioUrls = getTurnAudioUrls(turn);
      const hasAudio = audioUrls.length > 0;

      // For host turns, need either video OR at least one audio
      if (turn.isHostTurn) {
        return !!(turn.videoUrl || hasAudio);
      }
      // For participant turns, check both participant and at least one audio
      const hasParticipant =
        turn.participantId &&
        state.participants.some((p) => p.id === turn.participantId);
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
    addAudioTrack,
    updateAudioTrack,
    removeAudioTrack,
    reorderTurns,
    setCurrentTurnIndex,
    setIsPlaying,
    nextTurn,
    resetPlayback,
    setTemplate,
    loadFlowTemplate,
    updateIntroOutroConfig,
    setBroadcastPhase,
    setVideoFormat,
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
