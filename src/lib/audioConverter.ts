import { Mp3Encoder } from "@breezystack/lamejs";

export interface ConversionProgress {
  stage: "decoding" | "encoding" | "complete";
  progress: number; // 0-100
}

export interface ConversionResult {
  blob: Blob;
  url: string;
  originalName: string;
  convertedName: string;
}

/**
 * Checks if a file needs conversion to MP3
 * Returns true for formats that may not be universally supported
 */
export function needsConversion(file: File): boolean {
  const universalFormats = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
  ];

  // Check MIME type
  if (universalFormats.includes(file.type.toLowerCase())) {
    return false;
  }

  // Check file extension as fallback
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp3" || ext === "wav") {
    return false;
  }

  // All other formats (FLAC, OGG, M4A, AAC, etc.) should be converted
  return true;
}

/**
 * Converts an audio file to MP3 format using Web Audio API and lamejs
 */
export async function convertToMp3(
  file: File,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<ConversionResult> {
  onProgress?.({ stage: "decoding", progress: 0 });

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: "decoding", progress: 20 });

  // Create audio context for decoding
  const audioContext = new AudioContext();

  let audioBuffer: AudioBuffer;
  try {
    // Decode the audio data (works with FLAC, OGG, M4A, etc.)
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    audioContext.close();
    throw new Error(
      `Failed to decode audio file: ${error instanceof Error ? error.message : "Unknown format"}`,
    );
  }

  onProgress?.({ stage: "decoding", progress: 50 });

  // Get audio data
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  // Get channel data
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel =
    numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  onProgress?.({ stage: "encoding", progress: 0 });

  // Create MP3 encoder (128 kbps is a good balance of quality and size)
  const mp3Encoder = new Mp3Encoder(
    numberOfChannels > 1 ? 2 : 1,
    sampleRate,
    128,
  );

  // Process in chunks for better performance and progress reporting
  const chunkSize = 1152; // MP3 frame size
  const mp3Data: Uint8Array[] = [];

  // Convert float32 samples to int16
  const leftInt16 = floatTo16BitPCM(leftChannel);
  const rightInt16 =
    numberOfChannels > 1 ? floatTo16BitPCM(rightChannel) : undefined;

  const totalChunks = Math.ceil(length / chunkSize);

  for (let i = 0; i < length; i += chunkSize) {
    const leftChunk = leftInt16.subarray(i, i + chunkSize);
    const rightChunk = rightInt16?.subarray(i, i + chunkSize);

    let mp3buf: Uint8Array;
    if (numberOfChannels > 1 && rightChunk) {
      mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3Encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      // Copy the data to a new Uint8Array
      mp3Data.push(new Uint8Array(mp3buf));
    }

    // Report progress
    const currentChunk = Math.floor(i / chunkSize);
    const progress = Math.round((currentChunk / totalChunks) * 100);
    onProgress?.({ stage: "encoding", progress });
  }

  // Flush remaining data
  const finalBuf = mp3Encoder.flush();
  if (finalBuf.length > 0) {
    mp3Data.push(new Uint8Array(finalBuf));
  }

  // Clean up audio context
  audioContext.close();

  onProgress?.({ stage: "complete", progress: 100 });

  // Combine all chunks into a single blob
  // Cast to BlobPart[] to satisfy TypeScript's strict ArrayBuffer type checking
  const blob = new Blob(mp3Data as unknown as BlobPart[], {
    type: "audio/mpeg",
  });
  const url = URL.createObjectURL(blob);

  // Generate new filename
  const originalName = file.name;
  const baseName =
    originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
  const convertedName = `${baseName}.mp3`;

  return {
    blob,
    url,
    originalName,
    convertedName,
  };
}

/**
 * Converts Float32Array audio samples to Int16Array for MP3 encoding
 */
function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp value between -1 and 1
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return int16Array;
}

/**
 * Helper to convert a file if needed, or return the original
 */
export async function ensureMp3Compatible(
  file: File,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<{ file: File; url: string; wasConverted: boolean }> {
  if (!needsConversion(file)) {
    return {
      file,
      url: URL.createObjectURL(file),
      wasConverted: false,
    };
  }

  const result = await convertToMp3(file, onProgress);

  // Create a new File object from the blob
  const convertedFile = new File([result.blob], result.convertedName, {
    type: "audio/mpeg",
  });

  return {
    file: convertedFile,
    url: result.url,
    wasConverted: true,
  };
}
