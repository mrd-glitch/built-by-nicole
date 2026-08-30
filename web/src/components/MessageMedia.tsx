"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { sendMediaMessage } from "@/lib/actions";

/* Voice + video messages. Voice = in-app MediaRecorder (tap to record, tap to
   send). Video = native camera / picker via file input (most reliable on iOS).
   Files live in the private message-media bucket under the client's prefix so
   both the client and Nicole can read them. */

function pickAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function MediaComposer({ clientId, compact = false }: { clientId: string; compact?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  async function upload(blob: Blob, kind: "voice" | "video", ext: string, duration: number | null) {
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const path = `${clientId}/msg/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("message-media").upload(path, blob, {
      contentType: blob.type || undefined,
    });
    if (upErr) {
      setBusy(false);
      return setError("Upload failed. Try again.");
    }
    const res = await sendMediaMessage(clientId, kind, path, duration);
    setBusy(false);
    if (res?.error) setError(res.error);
  }

  async function startVoice() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickAudioMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
        if (duration >= 1) upload(blob, "voice", rec.mimeType.includes("mp4") ? "m4a" : "webm", duration);
      };
      recRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)), 500);
    } catch {
      setError("Mic blocked — allow microphone access in your browser settings.");
    }
  }

  function stopVoice() {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function onVideoFile(file: File | null) {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) return setError("That video is huge — keep it under ~3 minutes.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    upload(file, "video", ext, null);
  }

  const btnSize = compact ? 38 : 44;

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <button
          type="button"
          className="btn btn--primary"
          style={{ minHeight: btnSize, animation: "pulse 1.2s infinite" }}
          onClick={stopVoice}
          aria-label="Stop and send voice note"
        >
          ■ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} — send
        </button>
      ) : (
        <>
          <button
            type="button"
            className="flex items-center justify-center"
            style={{ width: btnSize, height: btnSize, borderRadius: "50%", border: "var(--rule-hairline)", background: "var(--surface-card)", cursor: "pointer", flexShrink: 0 }}
            onClick={startVoice}
            disabled={busy}
            aria-label="Record a voice note"
            title="Voice note"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pink-600, #E01860)" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
            </svg>
          </button>
          <label
            className="flex items-center justify-center"
            style={{ width: btnSize, height: btnSize, borderRadius: "50%", border: "var(--rule-hairline)", background: "var(--surface-card)", cursor: "pointer", flexShrink: 0 }}
            aria-label="Send a video"
            title="Video"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pink-600, #E01860)" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
            <input
              type="file"
              accept="video/*"
              capture="user"
              style={{ display: "none" }}
              onChange={(e) => {
                onVideoFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </>
      )}
      {busy && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Sending...</span>}
      {error && (
        <span role="alert" style={{ fontSize: "var(--text-xs)", color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* Inline playback for a voice/video message. Signed URL fetched on mount. */
export function MediaBubble({ path, kind, light = false }: { path: string; kind: "voice" | "video"; light?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabaseBrowser()
      .storage.from("message-media")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  if (failed)
    return <p style={{ fontSize: "var(--text-xs)", color: light ? "rgb(255 255 255 / 0.7)" : "var(--text-muted)" }}>Media unavailable.</p>;
  if (!url)
    return <p style={{ fontSize: "var(--text-xs)", color: light ? "rgb(255 255 255 / 0.7)" : "var(--text-muted)" }}>Loading {kind === "voice" ? "voice note" : "video"}...</p>;
  return kind === "voice" ? (
    <audio controls src={url} style={{ width: 220, maxWidth: "100%" }} preload="metadata" />
  ) : (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video controls src={url} style={{ width: 260, maxWidth: "100%", borderRadius: "var(--radius-md)" }} preload="metadata" playsInline />
  );
}
