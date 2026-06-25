import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { careerCoachChat, type ChatMessage } from "../services/innovativeFeaturesService";

const STARTERS = [
  "How do I transition into AI engineering?",
  "I have a job interview tomorrow — help me prepare",
  "What skills should I build for the next 6 months?",
  "How do I negotiate a 20% pay raise?",
  "I'm feeling stuck in my career — where do I start?",
];

export default function CareerCoachChat({ profile }: { profile?: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await careerCoachChat(trimmed, [...messages, userMsg], profile);
      setMessages((m) => [...m, { role: "coach", content: reply, timestamp: new Date() }]);
    } catch {
      setMessages((m) => [...m, { role: "coach", content: "Sorry, I'm having trouble connecting. Please try again in a moment.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'min(calc(100vh - 200px), 700px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Spark.E — AI Career Coach</h1>
          <p className="text-xs text-slate-500">Personalised career guidance, powered by AI</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <RotateCcw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '300px' }}>
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-slate-700 font-semibold mb-1">Hi{profile?.name ? `, ${profile.name}` : ""}! I'm Spark.E</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Your personal AI career coach. Ask me anything about your career, job search, interviews, or skills.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-full transition-all shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-indigo-600" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
                {msg.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
              </div>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 size={16} className="text-indigo-400 animate-spin" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask Spark.E anything about your career…"
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 shadow-sm"
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center text-white transition-all shadow-sm">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
