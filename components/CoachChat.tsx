"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { api, json } from "@/lib/models";
type Message = { role: "user" | "assistant"; content: string };
export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  async function load() {
    try {
      const out = await api<{ data: Message[]; configured: boolean }>(
        "/api/ai/coach",
      );
      setMessages(out.data);
      setConfigured(out.configured);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const question = input.trim();
    setInput("");
    setError("");
    setMessages((m) => [
      ...m,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const r = await fetch("/api/ai/coach", {
        ...json("POST", { message: question }),
        signal: abort.current.signal,
      });
      if (!r.ok) throw Error((await r.json()).error || "Coach unavailable");
      const reader = r.body?.getReader();
      if (!reader) throw Error("Missing response");
      const decoder = new TextDecoder();
      let buffer = "",
        completed = false;
      while (true) {
        const { done, value } = await reader.read();
        buffer += done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const part = JSON.parse(line);
          if (part.error) throw Error(part.error);
          if (part.done) completed = true;
          if (part.text)
            setMessages((m) =>
              m.map((x, i) =>
                i === m.length - 1
                  ? { ...x, content: x.content + part.text }
                  : x,
              ),
            );
        }
        if (done) break;
      }
      if (!completed)
        throw Error("The response was interrupted. Please try again.");
    } catch (e) {
      setError(
        (e as Error).name === "AbortError"
          ? "Response stopped. This exchange was not confirmed saved."
          : (e as Error).message,
      );
      setInput(question);
    } finally {
      setBusy(false);
    }
  }
  async function clear() {
    if (!confirm("Clear your saved conversation?")) return;
    setBusy(true);
    try {
      await api("/api/ai/coach", { method: "DELETE" });
      setMessages([]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="chat-layout">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A little clarity goes a long way</span>
          <h1 style={{ marginTop: 10 }}>Your nutrition coach</h1>
          <p className="muted">Grounded in your logs. Guided by your goals.</p>
        </div>
        <button
          className="ghost"
          onClick={clear}
          disabled={busy || !messages.length}
        >
          <Trash2 size={14} />
          Clear history
        </button>
      </div>
      <div className="panel">
        {!configured && (
          <p className="notice">
            AI coaching is awaiting configuration. Your tracking is still
            available.
          </p>
        )}
        <div className="chat-messages" aria-live="polite">
          {loading ? (
            <p className="muted">Loading your conversation…</p>
          ) : !messages.length ? (
            <div className="empty">
              <Sparkles size={32} color="#b6a0ff" />
              <h2>Let’s connect the dots.</h2>
              <p className="muted" style={{ maxWidth: 430 }}>
                Ask about your intake, explore a meal idea, or make sense of
                your weight trend. I’ll use your recent records and remember the
                conversation.
              </p>
              <div className="suggestions">
                {[
                  "Review my recent nutrition",
                  "Help me plan a high-protein meal",
                  "What does my weight trend suggest?",
                ].map((x) => (
                  <button key={x} onClick={() => setInput(x)}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div className={"message " + m.role} key={i}>
                <div className="message-label">
                  {m.role === "user" ? "You" : "AURA"}
                </div>
                {m.content || (
                  <span className="muted">Thinking through your context…</span>
                )}
              </div>
            ))
          )}
          <div ref={end} />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={send} className="composer">
          <textarea
            aria-label="Message to AURA"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What’s on your mind about nutrition?"
            maxLength={4000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            disabled={busy || loading || !configured || !input.trim()}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
          {busy && (
            <button
              type="button"
              className="ghost"
              onClick={() => abort.current?.abort()}
            >
              Stop
            </button>
          )}
        </form>
        <p className="muted" style={{ fontSize: 10, marginTop: 12 }}>
          Your question, recent logs, and conversation context are sent to
          Google Gemini. Guidance may be inaccurate and does not replace
          professional care. Targets change only when you edit them.
        </p>
      </div>
    </main>
  );
}
