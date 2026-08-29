"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions";

interface Msg {
  id: string;
  client_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function ClientThread({ clientId, initial }: { clientId: string; initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Realtime: new rows in my thread
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`messages-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Msg).id) ? prev : [...prev, payload.new as Msg],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    const body = draft.trim();
    setDraft("");
    const res = await sendMessage(clientId, body);
    setBusy(false);
    if (res?.error) setDraft(body);
  }

  return (
    <>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <p className="mt-6 text-center" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            Say hi. Nicole reads everything here.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === clientId;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "82%",
                background: mine ? "var(--pink-500)" : "var(--surface-card)",
                color: mine ? "var(--white)" : "var(--text-body)",
                border: mine ? "none" : "var(--rule-hairline)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-3) var(--space-4)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <p style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-body)" }}>{m.body}</p>
              <p
                className="metric mt-1"
                style={{ fontSize: "var(--text-2xs)", color: mine ? "rgb(255 255 255 / 0.7)" : "var(--text-faint)" }}
              >
                {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky mt-4 flex gap-2" style={{ bottom: "calc(var(--tabbar-height) + var(--space-4))" }}>
        <input
          className="input"
          placeholder="Message Nicole"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="btn btn--primary" onClick={send} disabled={busy} aria-label="Send message">
          Send
        </button>
      </div>
    </>
  );
}
