export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(audio.duration * 10) / 10;
      resolve(duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });

    audio.src = url;
  });
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(video.duration * 10) / 10;
      resolve(duration);
    });

    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });

    video.src = url;
    video.preload = "metadata";
  });
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationLong(seconds: number): string {
  if (seconds <= 0) return "00:00";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getTotalTurnDuration(
  audioTracks: Array<{ duration?: number }> | undefined,
  legacyDuration?: number,
): number {
  let total = legacyDuration || 0;
  if (audioTracks) {
    total += audioTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  }
  return total;
}
