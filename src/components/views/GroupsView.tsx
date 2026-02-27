import { useState, useRef, useEffect } from 'react';
import { Subject } from '@/types/uniflow';
import { useGroupFiles } from '@/hooks/useGroupFiles';
import { useAuth } from '@/hooks/useAuth';
import {
  useStudyGroups,
  useGroupMembers,
  useGroupTasks,
  useGroupMessages,
  useGroupLinks,
  useGroupPolls,
} from '@/hooks/useGroups';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreateGroupDrawer from '@/components/CreateGroupDrawer';
import {
  Plus,
  Users,
  ArrowLeft,
  Send,
  ClipboardCheck,
  MessageCircle,
  Link2,
  Vote,
  Trash2,
  UserPlus,
  Crown,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  X,
  HelpCircle,
  BookOpen,
  Paperclip,
  Image,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TutorialStep = ({ step, emoji, title, description }: { step: number; emoji: string; title: string; description: string }) => (
  <div className="flex gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
      {step}
    </div>
    <div>
      <p className="text-sm font-semibold">{emoji} {title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

interface GroupsViewProps {
  subjects: Subject[];
}

const GroupsView = ({ subjects }: GroupsViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { groups, loading, createGroup, deleteGroup } = useStudyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'links' | 'polls'>('tasks');

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  if (loading) {
    return (
      <div className="space-y-4 pb-4">
        <div className="animate-pulse h-8 bg-muted rounded w-40" />
        <div className="animate-pulse h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  // Group list
  if (!selectedGroupId) {
    return (
      <div className="space-y-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grupos</h1>
            <p className="text-sm text-muted-foreground">Trabalhos em equipe organizados</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTutorial(!showTutorial)}
            className="h-8 text-xs gap-1.5 rounded-full"
          >
            <HelpCircle size={14} />
            Como usar
          </Button>
        </motion.div>

        {/* Tutorial */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-card border-2 border-primary/20 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" /> Tutorial: Modo Grupo
                  </p>
                  <button onClick={() => setShowTutorial(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <TutorialStep
                    step={1}
                    emoji="➕"
                    title="Crie seu grupo"
                    description='Clique em "Criar grupo", dê um nome, escolha a disciplina e defina um prazo (opcional).'
                  />
                  <TutorialStep
                    step={2}
                    emoji="✉️"
                    title="Convide seus colegas"
                    description='Dentro do grupo, clique em "Convidar" e digite o e-mail do colega. Ele precisa ter conta no Study Hakify com o MESMO e-mail.'
                  />
                  <TutorialStep
                    step={3}
                    emoji="📲"
                    title="O que o convidado faz?"
                    description="O colega convidado só precisa abrir o app normalmente. O grupo já vai aparecer automaticamente na aba Grupos dele, sem precisar aceitar nada!"
                  />
                  <TutorialStep
                    step={4}
                    emoji="📋"
                    title="Organizem as tarefas"
                    description="Dividam as tarefas, atribuam responsáveis, usem o chat para se comunicar, compartilhem links e criem votações."
                  />
                  <TutorialStep
                    step={5}
                    emoji="⚡"
                    title="Dica importante"
                    description="Só o líder (quem criou o grupo) pode excluir o grupo e remover membros. Todos podem criar tarefas, enviar mensagens e votar."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-8 text-center shadow-sm"
          >
            <Users className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="text-sm font-semibold mb-1">Nenhum grupo ainda</p>
            <p className="text-xs text-muted-foreground mb-4">
              Crie um grupo para organizar trabalhos com seus colegas
            </p>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Criar grupo
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, idx) => {
              const subject = subjects.find((s) => s.id === group.subjectId);
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="w-full text-left rounded-2xl bg-card p-4 shadow-sm hover:bg-secondary/30 transition-colors flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                    style={{ backgroundColor: subject?.color || 'hsl(var(--primary))', opacity: 0.15 }}
                  >
                    <Users size={18} style={{ color: subject?.color || 'hsl(var(--primary))' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{group.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {subject?.name || 'Sem disciplina'}
                      {group.deadline && ` · Prazo: ${format(new Date(group.deadline), "dd/MM", { locale: ptBR })}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}

        {groups.length > 0 && (
          <Button variant="outline" onClick={() => setShowCreate(true)} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            Novo grupo
          </Button>
        )}

        <CreateGroupDrawer
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreate={createGroup}
          subjects={subjects}
        />
      </div>
    );
  }

  // Group detail
  return (
    <GroupDetail
      group={selectedGroup!}
      subjects={subjects}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={() => setSelectedGroupId(null)}
      onDelete={async () => {
        await deleteGroup(selectedGroupId);
        setSelectedGroupId(null);
      }}
    />
  );
};

/* ─── Group Detail ─── */

interface GroupDetailProps {
  group: {
    id: string;
    name: string;
    subjectId: string | null;
    description: string | null;
    deadline: string | null;
    leaderId: string;
  };
  subjects: Subject[];
  activeTab: 'tasks' | 'chat' | 'links' | 'polls';
  onTabChange: (tab: 'tasks' | 'chat' | 'links' | 'polls') => void;
  onBack: () => void;
  onDelete: () => void;
}

const GroupDetail = ({ group, subjects, activeTab, onTabChange, onBack, onDelete }: GroupDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isLeader = user?.id === group.leaderId;
  const subject = subjects.find((s) => s.id === group.subjectId);

  const { members, inviteByEmail, removeMember } = useGroupMembers(group.id);
  const { tasks, addTask, toggleTask, deleteTask } = useGroupTasks(group.id);
  const { messages, sendMessage } = useGroupMessages(group.id);
  const { links, addLink, deleteLink } = useGroupLinks(group.id);
  const { polls, createPoll, vote, closePoll } = useGroupPolls(group.id);
  const { uploadFile } = useGroupFiles(group.id);

  const handleUploadFile = async (file: File): Promise<string | null> => {
    const result = await uploadFile(file);
    return result?.url || null;
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('__none__');
  const [chatInput, setChatInput] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const { error } = await inviteByEmail(inviteEmail.trim(), group.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: '✅ Membro convidado!' });
      setInviteEmail('');
      setShowInvite(false);
    }
  };

  const tabs = [
    { id: 'tasks' as const, label: 'Tarefas', icon: ClipboardCheck },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'links' as const, label: 'Links', icon: Link2 },
    { id: 'polls' as const, label: 'Votação', icon: Vote },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground mb-2 hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{group.name}</h1>
            <p className="text-[11px] text-muted-foreground">
              {subject?.name || 'Sem disciplina'}
              {group.deadline && ` · Prazo: ${format(new Date(group.deadline), "dd 'de' MMMM", { locale: ptBR })}`}
            </p>
          </div>
          {isLeader && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
              <Trash2 size={16} />
            </Button>
          )}
        </div>
        {group.description && (
          <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
        )}
      </motion.div>

      {/* Progress */}
      <div className="rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Progresso do grupo</span>
          <span className="text-sm font-black text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 [&>div]:bg-primary" />
        <p className="text-[10px] text-muted-foreground mt-1">
          {completedTasks} de {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} concluída{completedTasks !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Members */}
      <div className="rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Membros ({members.length})</span>
          <Button variant="ghost" size="sm" onClick={() => setShowInvite(!showInvite)} className="h-7 text-xs">
            <UserPlus size={12} className="mr-1" />
            Convidar
          </Button>
        </div>

        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Email do colega"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button size="sm" onClick={handleInvite} disabled={!inviteEmail.trim()} className="h-8">
                  <Send size={12} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1 text-[10px]">
              {m.role === 'leader' && <Crown size={10} className="text-amber-500" />}
              <span className="font-medium">{m.displayName || m.email || 'Membro'}</span>
              {isLeader && m.userId !== user?.id && (
                <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'tasks' && (
            <TasksTab
              tasks={tasks}
              members={members}
              onAdd={addTask}
              onToggle={toggleTask}
              onDelete={deleteTask}
              newTitle={newTaskTitle}
              setNewTitle={setNewTaskTitle}
              assignee={newTaskAssignee}
              setAssignee={setNewTaskAssignee}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab
              messages={messages}
              currentUserId={user?.id || ''}
              input={chatInput}
              setInput={setChatInput}
              onSend={sendMessage}
              chatEndRef={chatEndRef}
              onUploadFile={handleUploadFile}
            />
          )}
          {activeTab === 'links' && (
            <LinksTab
              links={links}
              onAdd={addLink}
              onDelete={deleteLink}
              currentUserId={user?.id || ''}
              newTitle={newLinkTitle}
              setNewTitle={setNewLinkTitle}
              newUrl={newLinkUrl}
              setNewUrl={setNewLinkUrl}
              onUploadFile={handleUploadFile}
            />
          )}
          {activeTab === 'polls' && (
            <PollsTab
              polls={polls}
              currentUserId={user?.id || ''}
              onCreatePoll={createPoll}
              onVote={vote}
              onClose={closePoll}
              question={newPollQuestion}
              setQuestion={setNewPollQuestion}
              options={newPollOptions}
              setOptions={setNewPollOptions}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Tasks Tab ─── */

const TasksTab = ({
  tasks, members, onAdd, onToggle, onDelete, newTitle, setNewTitle, assignee, setAssignee,
}: {
  tasks: any[];
  members: any[];
  onAdd: (title: string, assignedTo?: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  assignee: string;
  setAssignee: (v: string) => void;
}) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <Input
        placeholder="Nova tarefa..."
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        className="h-9 text-xs"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && newTitle.trim()) {
            onAdd(newTitle.trim(), assignee === '__none__' ? undefined : assignee);
            setNewTitle('');
          }
        }}
      />
      <Select value={assignee} onValueChange={setAssignee}>
        <SelectTrigger className="h-9 w-28 text-[10px]">
          <SelectValue placeholder="Atribuir" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Ninguém</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId} value={m.userId}>
              {m.displayName || m.email || 'Membro'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-9 px-3"
        disabled={!newTitle.trim()}
        onClick={() => {
          if (newTitle.trim()) {
            onAdd(newTitle.trim(), assignee === '__none__' ? undefined : assignee);
            setNewTitle('');
          }
        }}
      >
        <Plus size={14} />
      </Button>
    </div>

    {tasks.length === 0 ? (
      <p className="text-center text-xs text-muted-foreground py-4">Nenhuma tarefa ainda</p>
    ) : (
      <div className="space-y-1.5">
        {tasks.map((task) => {
          const assignedMember = members.find((m) => m.userId === task.assignedTo);
          return (
            <div key={task.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 border border-border/40">
              <Checkbox checked={task.completed} onCheckedChange={() => onToggle(task.id)} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {assignedMember && (
                  <p className="text-[9px] text-muted-foreground">
                    → {assignedMember.displayName || assignedMember.email}
                  </p>
                )}
              </div>
              <button onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

/* ─── Chat Tab ─── */

const ChatTab = ({
  messages, currentUserId, input, setInput, onSend, chatEndRef, onUploadFile,
}: {
  messages: any[];
  currentUserId: string;
  input: string;
  setInput: (v: string) => void;
  onSend: (content: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onUploadFile: (file: File) => Promise<string | null>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUploadFile(file);
    if (url) {
      const isImage = file.type.startsWith('image/');
      onSend(isImage ? `[imagem] ${url}` : `[arquivo: ${file.name}] ${url}`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderMessageContent = (content: string, isMe: boolean) => {
    const imageMatch = content.match(/^\[imagem\] (.+)$/);
    if (imageMatch) {
      return (
        <img
          src={imageMatch[1]}
          alt="Imagem compartilhada"
          className="rounded-lg max-w-full max-h-48 cursor-pointer"
          onClick={() => window.open(imageMatch[1], '_blank')}
        />
      );
    }
    const fileMatch = content.match(/^\[arquivo: (.+?)\] (.+)$/);
    if (fileMatch) {
      return (
        <a href={fileMatch[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline">
          <FileText size={12} />
          <span className="text-[11px]">{fileMatch[1]}</span>
        </a>
      );
    }
    return <p className="text-[11px] leading-relaxed">{content}</p>;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="rounded-2xl bg-card border border-border/40 p-3 max-h-64 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">Nenhuma mensagem</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`rounded-2xl px-3 py-1.5 max-w-[80%] ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {!isMe && (
                  <p className="text-[9px] font-bold opacity-70 mb-0.5">
                    {msg.displayName || 'Membro'}
                  </p>
                )}
                {renderMessageContent(msg.content, isMe)}
                <p className={`text-[8px] mt-0.5 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Paperclip size={16} />
          )}
        </Button>
        <Input
          placeholder="Mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-9 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onSend(input.trim());
              setInput('');
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => { if (input.trim()) { onSend(input.trim()); setInput(''); } }}
          disabled={!input.trim()}
          className="h-9"
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
};

const LinksTab = ({
  links, onAdd, onDelete, currentUserId, newTitle, setNewTitle, newUrl, setNewUrl, onUploadFile,
}: {
  links: any[];
  onAdd: (title: string, url: string) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newUrl: string;
  setNewUrl: (v: string) => void;
  onUploadFile: (file: File) => Promise<string | null>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUploadFile(file);
    if (url) {
      onAdd(file.name, url);
      setNewTitle('');
      setNewUrl('');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFileUrl = (url: string) => url.includes('group-files');

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="space-y-2">
        <Input placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-8 text-xs" />
        <div className="flex gap-2">
          <Input placeholder="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="h-8 text-xs" />
          <Button
            size="sm"
            className="h-8"
            disabled={!newTitle.trim() || !newUrl.trim()}
            onClick={() => { onAdd(newTitle.trim(), newUrl.trim()); setNewTitle(''); setNewUrl(''); }}
          >
            <Plus size={14} />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Paperclip size={12} />
          )}
          {uploading ? 'Enviando...' : 'Enviar arquivo'}
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">Nenhum link ou arquivo compartilhado</p>
      ) : (
        <div className="space-y-1.5">
          {links.map((link) => {
            const isFile = isFileUrl(link.url);
            return (
              <div key={link.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 border border-border/40">
                {isFile ? (
                  <FileText size={12} className="text-primary shrink-0" />
                ) : (
                  <Link2 size={12} className="text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{link.title}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary truncate flex items-center gap-0.5">
                    {isFile ? 'Abrir arquivo' : link.url.replace(/^https?:\/\//, '').slice(0, 40)}
                    <ExternalLink size={8} />
                  </a>
                </div>
                {link.userId === currentUserId && (
                  <button onClick={() => onDelete(link.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Polls Tab ─── */

const PollsTab = ({
  polls, currentUserId, onCreatePoll, onVote, onClose,
  question, setQuestion, options, setOptions,
}: {
  polls: any[];
  currentUserId: string;
  onCreatePoll: (question: string, options: string[]) => void;
  onVote: (pollId: string, option: string) => void;
  onClose: (pollId: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  options: string[];
  setOptions: (v: string[]) => void;
}) => (
  <div className="space-y-3">
    {/* Create poll */}
    <div className="rounded-xl bg-card border border-border/40 p-3 space-y-2">
      <Input
        placeholder="Pergunta da votação..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="h-8 text-xs"
      />
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder={`Opção ${i + 1}`}
            value={opt}
            onChange={(e) => {
              const newOpts = [...options];
              newOpts[i] = e.target.value;
              setOptions(newOpts);
            }}
            className="h-7 text-[10px]"
          />
          {options.length > 2 && (
            <button
              onClick={() => setOptions(options.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-destructive"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        {options.length < 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px]"
            onClick={() => setOptions([...options, ''])}
          >
            <Plus size={10} className="mr-1" />
            Opção
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 text-[10px] ml-auto"
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
          onClick={() => {
            onCreatePoll(question.trim(), options.filter((o) => o.trim()));
            setQuestion('');
            setOptions(['', '']);
          }}
        >
          Criar votação
        </Button>
      </div>
    </div>

    {/* Existing polls */}
    {polls.map((poll) => {
      const totalVotes = Object.keys(poll.votes).length;
      const myVote = poll.votes[currentUserId];
      const isCreator = poll.createdBy === currentUserId;
      const validOptions = poll.options as string[];

      return (
        <div key={poll.id} className="rounded-xl bg-card border border-border/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">{poll.question}</p>
            {poll.closed && (
              <Badge variant="secondary" className="text-[8px]">Encerrada</Badge>
            )}
          </div>

          {validOptions.map((option: string) => {
            const votes = Object.values(poll.votes).filter((v) => v === option).length;
            const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const isMyVote = myVote === option;

            return (
              <button
                key={option}
                disabled={poll.closed || !!myVote}
                onClick={() => onVote(poll.id, option)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors border ${
                  isMyVote
                    ? 'border-primary bg-primary/10'
                    : 'border-border/40 hover:bg-muted/50'
                } ${poll.closed || myVote ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium">{option}</span>
                  {(myVote || poll.closed) && (
                    <span className="text-[10px] text-muted-foreground">{votes} voto{votes !== 1 ? 's' : ''} ({Math.round(pct)}%)</span>
                  )}
                </div>
                {(myVote || poll.closed) && (
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </button>
            );
          })}

          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">{totalVotes} voto{totalVotes !== 1 ? 's' : ''}</span>
            {isCreator && !poll.closed && (
              <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => onClose(poll.id)}>
                Encerrar
              </Button>
            )}
          </div>
        </div>
      );
    })}

    {polls.length === 0 && (
      <p className="text-center text-xs text-muted-foreground py-2">Nenhuma votação ainda</p>
    )}
  </div>
);

export default GroupsView;
