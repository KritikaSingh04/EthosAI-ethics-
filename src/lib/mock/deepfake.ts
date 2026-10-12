import { mulberry32 } from "@/lib/rng";

export type MediaKind = "video" | "image" | "audio";

export type DetectorSignal = { key: string; label: string; score: number; note: string };

export type C2PAManifest = {
  present: boolean;
  signatureValid?: boolean;
  signer?: string;
  claimGenerator?: string;
  hashMatch?: boolean;
  aiGeneratedAssertion?: boolean;
  history: { action: string; tool: string; when: string }[];
};

export type MediaSample = {
  id: string;
  file: string;
  kind: MediaKind;
  size: string;
  duration?: string;
  resolution?: string;
  source: string;
  /** Model probability the media is authentic (0–1). */
  authenticity: number;
  signals: DetectorSignal[];
  manifest: C2PAManifest;
  exif: Record<string, string>;
  /** Seed + hotspots used to synthesise the artifact heatmap. */
  heat: { seed: number; spots: { x: number; y: number; r: number; v: number }[] };
};

export const MEDIA: MediaSample[] = [
  {
    id: "m1",
    file: "ceo_quarterly_statement.mp4",
    kind: "video",
    size: "48.2 MB",
    duration: "01:42",
    resolution: "1920×1080",
    source: "Forwarded via messaging app",
    authenticity: 0.14,
    signals: [
      { key: "blend", label: "Face boundary blending", score: 0.91, note: "Soft alpha seam along jaw/hairline in 63% of frames" },
      { key: "blink", label: "Blink-rate anomaly", score: 0.72, note: "4.1 blinks/min vs. human baseline 15–20" },
      { key: "lipsync", label: "Lip–audio desync", score: 0.84, note: "Phoneme–viseme offset peaks at 180 ms" },
      { key: "freq", label: "GAN frequency fingerprint", score: 0.77, note: "Periodic upsampling peaks in DCT spectrum" },
      { key: "light", label: "Lighting inconsistency", score: 0.58, note: "Specular highlight direction differs face vs. background" },
    ],
    manifest: { present: false, history: [] },
    exif: { Encoder: "Lavf60.3.100", "Creation date": "—", "GPS": "Stripped", "Camera model": "—", "Re-encoded": "3× (H.264)" },
    heat: { seed: 11, spots: [{ x: 0.5, y: 0.38, r: 0.2, v: 1 }, { x: 0.5, y: 0.6, r: 0.1, v: 0.8 }] },
  },
  {
    id: "m2",
    file: "press_photo_rally.jpg",
    kind: "image",
    size: "3.9 MB",
    resolution: "4032×3024",
    source: "Newswire upload",
    authenticity: 0.93,
    signals: [
      { key: "blend", label: "Splice / copy-move detection", score: 0.08, note: "No duplicated regions found" },
      { key: "freq", label: "GAN frequency fingerprint", score: 0.06, note: "Spectrum consistent with camera ISP" },
      { key: "noise", label: "Sensor noise (PRNU) consistency", score: 0.11, note: "Uniform PRNU pattern across frame" },
      { key: "light", label: "Lighting inconsistency", score: 0.14, note: "Shadows consistent with single source" },
    ],
    manifest: {
      present: true,
      signatureValid: true,
      signer: "Reuters Newsroom (DigiCert)",
      claimGenerator: "Leica M11-P firmware 2.1",
      hashMatch: true,
      aiGeneratedAssertion: false,
      history: [
        { action: "c2pa.created", tool: "Leica M11-P", when: "2026-09-28 10:14" },
        { action: "c2pa.color_adjustments", tool: "Adobe Lightroom 14.2", when: "2026-09-28 11:02" },
        { action: "c2pa.cropped", tool: "Adobe Lightroom 14.2", when: "2026-09-28 11:03" },
      ],
    },
    exif: { "Camera model": "Leica M11-P", Lens: "Summilux 35mm f/1.4", "Creation date": "2026-09-28 10:14:22", GPS: "Present", Software: "Lightroom 14.2" },
    heat: { seed: 23, spots: [{ x: 0.7, y: 0.3, r: 0.08, v: 0.2 }] },
  },
  {
    id: "m3",
    file: "bank_manager_voicenote.wav",
    kind: "audio",
    size: "1.1 MB",
    duration: "00:38",
    source: "Customer complaint ticket #88213",
    authenticity: 0.31,
    signals: [
      { key: "spectral", label: "Vocoder spectral artifacts", score: 0.81, note: "Smoothed high-band energy above 7 kHz" },
      { key: "prosody", label: "Prosody flatness", score: 0.66, note: "Low pitch variance in emotional phrases" },
      { key: "breath", label: "Missing breath/room noise", score: 0.74, note: "Silence floor −92 dB between phrases" },
      { key: "replay", label: "Replay / channel mismatch", score: 0.29, note: "Channel response plausible for mobile mic" },
    ],
    manifest: { present: false, history: [] },
    exif: { Codec: "PCM 16-bit", "Sample rate": "22.05 kHz", "Creation date": "—", Software: "—" },
    heat: { seed: 5, spots: [{ x: 0.75, y: 0.2, r: 0.25, v: 0.9 }, { x: 0.3, y: 0.25, r: 0.12, v: 0.5 }] },
  },
  {
    id: "m4",
    file: "campaign_ad_v3.mp4",
    kind: "video",
    size: "112.5 MB",
    duration: "00:30",
    resolution: "3840×2160",
    source: "Political ad library submission",
    authenticity: 0.47,
    signals: [
      { key: "blend", label: "Face boundary blending", score: 0.22, note: "Clean boundaries" },
      { key: "freq", label: "Diffusion fingerprint", score: 0.69, note: "Background plates match text-to-video model signature" },
      { key: "lipsync", label: "Lip–audio desync", score: 0.18, note: "Within tolerance" },
      { key: "light", label: "Lighting inconsistency", score: 0.41, note: "Background crowd lit inconsistently with subject" },
    ],
    manifest: {
      present: true,
      signatureValid: true,
      signer: "Studio Nine Creative (self-signed)",
      claimGenerator: "Adobe Premiere Pro 25.1",
      hashMatch: true,
      aiGeneratedAssertion: true,
      history: [
        { action: "c2pa.created", tool: "Sony FX6", when: "2026-09-02 16:40" },
        { action: "c2pa.placed (trainedAlgorithmicMedia)", tool: "Generative video model", when: "2026-09-05 12:10" },
        { action: "c2pa.edited", tool: "Adobe Premiere Pro 25.1", when: "2026-09-06 09:31" },
      ],
    },
    exif: { "Camera model": "Sony FX6", "Creation date": "2026-09-02", Software: "Premiere Pro 25.1", GPS: "Stripped" },
    heat: { seed: 31, spots: [{ x: 0.2, y: 0.7, r: 0.22, v: 0.75 }, { x: 0.85, y: 0.65, r: 0.18, v: 0.6 }] },
  },
];

export const HEAT_COLS = 24;
export const HEAT_ROWS = 14;

/** Artifact intensity grid (0–1): hotspots + seeded noise. */
export function heatmap(sample: MediaSample): number[][] {
  const rand = mulberry32(sample.heat.seed);
  return Array.from({ length: HEAT_ROWS }, (_, r) =>
    Array.from({ length: HEAT_COLS }, (_, c) => {
      const x = (c + 0.5) / HEAT_COLS;
      const y = (r + 0.5) / HEAT_ROWS;
      let v = rand() * 0.12;
      for (const s of sample.heat.spots) {
        const d = Math.hypot(x - s.x, (y - s.y) * (HEAT_ROWS / HEAT_COLS) * 1.7);
        v += s.v * Math.exp(-(d * d) / (2 * s.r * s.r * 0.5));
      }
      return Math.min(1, v);
    }),
  );
}

export type Threat = {
  id: string;
  threat: string;
  harm: string;
  likelihood: number; // 1–5
  severity: number; // 1–5
  affected: string;
  mitigations: string[];
};

export const THREATS: Threat[] = [
  { id: "t1", threat: "Identity impersonation", harm: "Executive / official voice & face cloning used to authorise transfers or statements", likelihood: 4, severity: 5, affected: "Employees, customers, markets", mitigations: ["Out-of-band verification for payment requests", "C2PA signing of official media", "Voice liveness on IVR"] },
  { id: "t2", threat: "Consent violation (NCII)", harm: "Non-consensual intimate or sexualised imagery of real people", likelihood: 4, severity: 5, affected: "Individuals, especially women & minors", mitigations: ["Hash-matching takedown (StopNCII)", "Rapid notice-and-removal SLA", "Model-level refusal for real-person nudity"] },
  { id: "t3", threat: "Electoral disinformation", harm: "Fabricated candidate speech released close to polling", likelihood: 3, severity: 5, affected: "Voters, democratic process", mitigations: ["Mandatory AI-content labels (EU AI Act Art. 50)", "Ad-library provenance checks", "Pre-bunking campaigns"] },
  { id: "t4", threat: "Social-engineering fraud", harm: "Synthetic voice notes from 'relatives' or 'bank staff'", likelihood: 5, severity: 3, affected: "Elderly & low-digital-literacy users", mitigations: ["Customer callback codes", "Telecom-level spoof flags", "Awareness nudges"] },
  { id: "t5", threat: "Liar's dividend", harm: "Authentic evidence dismissed as 'deepfake' to evade accountability", likelihood: 3, severity: 4, affected: "Courts, journalists, public trust", mitigations: ["Capture-time provenance", "Chain-of-custody logging", "Forensic expert attestations"] },
  { id: "t6", threat: "Reputational sabotage", harm: "Fabricated misconduct clips targeting individuals or brands", likelihood: 3, severity: 3, affected: "Public figures, SMEs", mitigations: ["Monitoring & rapid response", "Platform escalation channels"] },
];
