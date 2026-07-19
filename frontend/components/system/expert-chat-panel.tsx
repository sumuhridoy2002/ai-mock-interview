"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  session_id: string;
}

interface ChatReplyResponse {
  reply: string;
  suggested_followups: string[];
  session_id: string;
}

const SESSION_STORAGE_KEY = "mip_expert_chat_session";

const SUGGESTED_PROMPTS = [
  "How do you evaluate our interview questions and our answers?",
  "What scoring dimensions do you use?",
  "Which AI models power the scoring?",
  "How does behavior analysis affect my score?",
];

export function ExpertChatPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followups, setFollowups] = useState<string[]>(SUGGESTED_PROMPTS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
    const query = stored ? `?session_id=${stored}` : "";
    api<ChatHistoryResponse>(`/expert/chat${query}`)
      .then((res) => {
        setSessionId(res.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, res.session_id);
        setMessages(res.messages || []);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);

      try {
        const res = await api<ChatReplyResponse>("/expert/chat", {
          method: "POST",
          body: JSON.stringify({ message: trimmed, session_id: sessionId }),
        });
        setSessionId(res.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, res.session_id);
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
        if (res.suggested_followups?.length) {
          setFollowups(res.suggested_followups);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong reaching the AI service. Please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading],
  );

  return (
    <div className="rounded-2xl border border-border bg-card shadow-md flex flex-col h-[calc(100vh-16rem)] min-h-[460px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Ask me anything about how Mock Interview Pro works</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              I can explain scoring, behavior analysis, mastery memory, and how to improve your answers.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground",
              )}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-2 px-5 pb-3">
        {followups.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void sendMessage(q)}
            disabled={loading}
            className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about scoring, evaluation, or interview strategy…"
          disabled={loading}
          className="flex-1 h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
