/**
 * camera.js — Camera mirror overlay & self-recorder
 */

let cameraStream = null;

/* ── KAMERA (MIRROR) ────────────────────── */
export async function openCamera() {
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo");
  if (!overlay || !video) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    video.srcObject = cameraStream;
    overlay.classList.add("open");
  } catch (err) {
    alert("Gagal mengakses kamera. Cek izin browser.");
  }
}

export function closeCamera() {
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo");
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (video) video.srcObject = null;
  if (overlay) overlay.classList.remove("open");
}

/* ── SELF RECORDER (FULLSCREEN) ──────────────── */
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

export async function toggleRecord() {
  const btn = document.getElementById("fsRecordBtn");
  const playbackBar = document.getElementById("fsRecorderBar");
  const audioEl = document.getElementById("fsAudioPlayback");

  if (isRecording) {
    mediaRecorder.stop();
    btn.classList.remove("active");
    btn.textContent = "🎙️";
    isRecording = false;

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioEl) audioEl.src = audioUrl;
      if (playbackBar) playbackBar.style.display = "block";
      audioChunks = [];
    };
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      isRecording = true;

      btn.classList.add("active");
      btn.textContent = "⏹️";
      if (playbackBar) playbackBar.style.display = "none";

      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };
    } catch (err) {
      alert(
        "Gagal merekam. Izinkan akses mikrofon di pengaturan browser Anda.",
      );
    }
  }
}
