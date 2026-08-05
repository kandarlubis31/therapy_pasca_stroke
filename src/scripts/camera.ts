/**
 * camera.ts — Kamera (mirror) dan perekaman suara
 */

import { safeVibrate } from "./vibrate.js";

let cameraStream: MediaStream | null = null;
let isMirrorFullscreen = false;
let mirrorEscHandler: ((e: KeyboardEvent) => void) | null = null;

export async function openCamera(): Promise<void> {
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo") as HTMLVideoElement | null;
  if (!overlay || !video || overlay.classList.contains("open")) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    video.srcObject = cameraStream;
    await video.play();
    overlay.classList.add("open");
  } catch {
    alert("Kamera belum bisa diakses. Coba buka Pengaturan browser > Izinkan Kamera, lalu buka lagi ya.");
  }
}

export function closeCamera(): void {
  safeVibrate(10);
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo") as HTMLVideoElement | null;

  // Exit mirror fullscreen first if active
  if (isMirrorFullscreen) {
    closeMirrorFullscreen();
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }

  if (video) video.srcObject = null;
  // Cleanup recorder stream too
  if (recorderStream) {
    recorderStream.getTracks().forEach(t => t.stop());
    recorderStream = null;
  }
  if (overlay) {
    overlay.classList.remove("open");
    if ((window as any).__cameraResetPosition) (window as any).__cameraResetPosition();
  }
}

/* ── MIRROR FULLSCREEN MODE ────────────────── */

/** Toggle the camera overlay between small draggable and fullscreen mirror */
export function toggleMirrorFullscreen(): void {
  safeVibrate(10);
  if (isMirrorFullscreen) {
    closeMirrorFullscreen();
  } else {
    openMirrorFullscreen();
  }
}

/** Expand the camera overlay to fullscreen mirror view */
export function openMirrorFullscreen(): void {
  const overlay = document.getElementById("cameraOverlay");
  if (!overlay || isMirrorFullscreen) return;

  // If camera isn't open yet, open it first
  if (!overlay.classList.contains("open")) {
    openCamera().then(() => {
      if (overlay.classList.contains("open")) {
        applyMirrorFullscreen(overlay);
      }
    });
    return;
  }

  applyMirrorFullscreen(overlay);
}

function applyMirrorFullscreen(overlay: HTMLElement): void {
  isMirrorFullscreen = true;
  overlay.classList.add("mirror-fullscreen");
  // Reset any custom drag position
  if ((window as any).__cameraResetPosition) {
    (window as any).__cameraResetPosition();
  }
  // Update button icon
  const expandBtn = overlay.querySelector<HTMLElement>(".camera-expand");
  if (expandBtn) expandBtn.textContent = "↙";
  // Lock body scroll
  document.body.style.overflow = "hidden";
  // Escape key to exit
  mirrorEscHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeMirrorFullscreen();
    }
  };
  document.addEventListener("keydown", mirrorEscHandler);
}

/** Collapse fullscreen mirror back to small draggable overlay */
export function closeMirrorFullscreen(): void {
  const overlay = document.getElementById("cameraOverlay");
  if (!overlay) return;

  isMirrorFullscreen = false;
  overlay.classList.remove("mirror-fullscreen");
  // Update button icon
  const expandBtn = overlay.querySelector<HTMLElement>(".camera-expand");
  if (expandBtn) expandBtn.textContent = "⛶";
  // Restore body scroll
  document.body.style.overflow = "";
  // Clean up Escape key handler
  if (mirrorEscHandler) {
    document.removeEventListener("keydown", mirrorEscHandler);
    mirrorEscHandler = null;
  }
}

/** Check if mirror is currently in fullscreen mode */
export function isInMirrorFullscreen(): boolean {
  return isMirrorFullscreen;
}

/* ── SELF RECORDER (FULLSCREEN) ──────────────── */
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;

let recorderStream: MediaStream | null = null;

export async function toggleRecord(): Promise<void> {
  safeVibrate(15);
  const btn = document.getElementById("fsRecordBtn");
  const playbackBar = document.getElementById("fsRecorderBar");
  const audioEl = document.getElementById("fsAudioPlayback") as HTMLAudioElement | null;

  if (isRecording && mediaRecorder) {
    mediaRecorder.stop();
    if (btn) {
      btn.classList.remove("active");
      btn.textContent = "🎙️";
    }
    isRecording = false;

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioEl) audioEl.src = audioUrl;
      if (playbackBar) playbackBar.style.display = "block";
      audioChunks = [];
      // Cleanup stream tracks
      if (recorderStream) {
        recorderStream.getTracks().forEach(t => t.stop());
        recorderStream = null;
      }
    };
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStream = stream;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      isRecording = true;

      if (btn) {
        btn.classList.add("active");
        btn.textContent = "⏹️";
      }
      if (playbackBar) playbackBar.style.display = "none";

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        audioChunks.push(e.data);
      };
    } catch {
      alert("Mikrofon belum bisa dipakai. Coba izinkan akses mikrofon di pengaturan browser kamu.");
    }
  }
}
