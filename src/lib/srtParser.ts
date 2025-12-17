import { SubtitleCue } from "@/types/debate";

/**
 * Parses an SRT (SubRip) subtitle file and returns an array of subtitle cues
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];

  // Normalize line endings and split into blocks
  const normalized = srtContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    if (lines.length < 3) continue;

    // First line is the cue number
    const id = parseInt(lines[0], 10);
    if (isNaN(id)) continue;

    // Second line is the timestamp
    const timestampLine = lines[1];
    const timestamps = parseTimestampLine(timestampLine);
    if (!timestamps) continue;

    // Remaining lines are the subtitle text
    const text = lines.slice(2).join("\n").trim();

    cues.push({
      id,
      startTime: timestamps.start,
      endTime: timestamps.end,
      text,
    });
  }

  return cues;
}

/**
 * Parses a timestamp line like "00:00:01,500 --> 00:00:04,000"
 * Returns start and end times in seconds
 */
function parseTimestampLine(
  line: string
): { start: number; end: number } | null {
  const match = line.match(
    /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
  );

  if (!match) return null;

  const start = timestampToSeconds(
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    parseInt(match[4], 10)
  );

  const end = timestampToSeconds(
    parseInt(match[5], 10),
    parseInt(match[6], 10),
    parseInt(match[7], 10),
    parseInt(match[8], 10)
  );

  return { start, end };
}

/**
 * Converts hours, minutes, seconds, and milliseconds to total seconds
 */
function timestampToSeconds(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number
): number {
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Finds the current subtitle cue based on the current playback time
 */
export function getCurrentCue(
  cues: SubtitleCue[],
  currentTime: number
): SubtitleCue | null {
  for (const cue of cues) {
    if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
      return cue;
    }
  }
  return null;
}

/**
 * Reads an SRT file and parses it
 */
export async function parseSRTFile(file: File): Promise<SubtitleCue[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const cues = parseSRT(content);
        resolve(cues);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Formats seconds to SRT timestamp format (HH:MM:SS,mmm)
 */
export function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}
