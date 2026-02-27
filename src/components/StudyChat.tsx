import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Plus, ChevronLeft, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import hakiAvatar from '@/assets/haki-avatar.png';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';

type Msg = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; updated_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`;

interface StudyChatProps {
  subjects?: Subject[];
  activities?: Activity[];
  attendance?: AttendanceRecord[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  academicStatus?: string;
}

const StudyChat = ({ subjects = [], activities = [], attendance = [], externalOpen, onExternalOpenChange, academicStatus = 'calouro' }: StudyChatProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(v);
    setInternalOpen(v);
  };
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvos(true);
    const { data } = await supabase
      .from('chat_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setConversations(data || []);
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  const openConversation = async (convoId: string) => {
    setActiveConvoId(convoId);
    setView('chat');
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages((data as Msg[]) || []);
  };

  const newConversation = () => {
    setActiveConvoId(null);
    setMessages([]);
    setView('chat');
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('chat_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) {
      setActiveConvoId(null);
      setMessages([]);
      setView('list');
    }
  };

  const autoTitle = (text: string) => text.length > 40 ? text.slice(0, 40) + '…' : text;

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading || !user) return;

    const userMsg: Msg = { role: 'user', content: text };
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let convoId = activeConvoId;

    if (!convoId) {
      const { data } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, title: autoTitle(text) })
        .select('id')
        .single();
      if (!data) { setIsLoading(false); return; }
      convoId = data.id;
      setActiveConvoId(convoId);
    }

    await supabase.from('chat_messages').insert({
      conversation_id: convoId, user_id: user.id, role: 'user', content: text,
    });

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          subjects: subjects.map(s => ({
            name: s.name,
            type: s.type,
            professor: s.professor,
            location: s.location,
            schedules: s.schedules,
            workload: s.workload,
          })),
          activities: activities.map(a => ({
            title: a.title,
            subjectId: a.subjectId,
            activityType: a.activityType,
            deadline: a.deadline,
            status: a.status,
            priority: a.priority,
            grade: a.grade,
            weight: a.weight,
          })),
          academicStatus,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Erro na conexão' }));
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.error || 'Erro ao conectar.'}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant')
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
                return [...prev, { role: 'assistant', content: snapshot }];
              });
            }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }

      if (assistantSoFar) {
        await supabase.from('chat_messages').insert({
          conversation_id: convoId, user_id: user.id, role: 'assistant', content: assistantSoFar,
        });
        await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convoId);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro de conexão.' }]);
    }
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <>
      {/* FAB — gradient with pulse ring */}
      <AnimatePresence>
      {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-40 group"
          >
            {/* Outer glow ring */}
            <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-md opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />
            {/* Animated pulse ring */}
            <span className="absolute -inset-1 rounded-2xl animate-ping bg-gradient-to-br from-primary/15 to-accent/15 pointer-events-none" style={{ animationDuration: '3s' }} />
            {/* Main button */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/40 shadow-[0_8px_28px_hsl(var(--primary)/0.4)] group-hover:shadow-[0_10px_36px_hsl(var(--primary)/0.55)] group-hover:ring-primary/60 transition-all duration-300 group-hover:scale-105">
              <img src={hakiAvatar} alt="Haki" className="w-full h-full object-cover" />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Status dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-card shadow-sm z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[400px] z-50 bg-card border-2 border-primary/30 rounded-3xl shadow-[0_20px_60px_hsl(var(--primary)/0.15),0_0_0_1px_hsl(var(--primary)/0.1)] flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header with gradient accent */}
            <div className="relative px-4 py-3.5 border-b border-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-accent/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {view === 'chat' && (
                    <button
                      onClick={() => { setView('list'); loadConversations(); }}
                      className="w-8 h-8 rounded-xl bg-muted/60 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <img src={hakiAvatar} alt="Haki" className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">Haki</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {view === 'list' ? 'Suas conversas' : 'Tutor de estudo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {view === 'list' && (
                    <button
                      onClick={newConversation}
                      className="w-8 h-8 rounded-xl bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
                      title="Nova conversa"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl bg-muted/60 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {view === 'list' ? (
              /* ---- Conversation list ---- */
              <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[420px]">
                {loadingConvos ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 grid place-items-center">
                      <MessageCircle className="w-7 h-7 text-primary/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Nenhuma conversa</p>
                    <p className="text-xs text-muted-foreground mb-4">Comece perguntando algo sobre suas matérias</p>
                    <button
                      onClick={newConversation}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3.5 py-2 rounded-xl hover:bg-primary/15 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova conversa
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 space-y-1">
                    {conversations.map(c => (
                      <button
                        key={c.id}
                        onClick={() => openConversation(c.id)}
                        className="w-full text-left flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl hover:bg-muted/50 transition-all group"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-muted grid place-items-center shrink-0">
                            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{c.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(c.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(c.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ---- Chat view ---- */
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[420px] scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 grid place-items-center">
                        <Sparkles className="w-6 h-6 text-primary/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">E aí! Sou o Haki 👋</p>
                      <p className="text-xs text-muted-foreground mb-5">Me pergunta qualquer coisa sobre suas matérias</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          { emoji: '📐', text: 'Explica derivada' },
                          { emoji: '⚖️', text: 'Resumo de Direito Civil' },
                          { emoji: '💻', text: 'O que é POO?' },
                        ].map(s => (
                          <button
                            key={s.text}
                            onClick={() => setInput(s.text)}
                            className="flex items-center gap-1.5 text-xs font-medium bg-muted/70 text-muted-foreground px-3 py-2 rounded-xl hover:bg-muted transition-colors border border-border/40"
                          >
                            <span>{s.emoji}</span>
                            {s.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <img src={hakiAvatar} alt="Haki" className="w-6 h-6 rounded-lg mr-2 mt-1 shrink-0 object-cover" />
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-lg'
                            : 'bg-muted/70 text-foreground rounded-bl-lg border border-border/30'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-sm [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <img src={hakiAvatar} alt="Haki" className="w-6 h-6 rounded-lg mr-2 mt-1 shrink-0 object-cover" />
                      <div className="bg-muted/70 rounded-2xl rounded-bl-lg px-4 py-3 border border-border/30">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0s' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-border p-3 bg-card">
                  <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Pergunta algo..."
                      className="flex-1 bg-muted/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/40 focus:border-primary/30 focus:bg-muted/70 transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center disabled:opacity-30 transition-opacity shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudyChat;
