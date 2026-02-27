import { TabId } from '@/types/uniflow';
import { LayoutDashboard, Calendar, CheckSquare, StickyNote, UserCheck, User, GraduationCap, Users, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'schedule', label: 'Horários', icon: Calendar },
  { id: 'activities', label: 'Tarefas', icon: CheckSquare },
  { id: 'grades', label: 'Notas', icon: GraduationCap },
  { id: 'attendance', label: 'Frequência', icon: UserCheck },
  { id: 'notes', label: 'Anotações', icon: StickyNote },
  { id: 'groups', label: 'Grupos', icon: Users },
  { id: 'materials', label: 'Materiais', icon: FolderOpen },
  { id: 'profile', label: 'Perfil', icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center safe-bottom px-3 pb-2 pt-1">
      <div
        className="hover:scale-x-[1.02] transition-all duration-300 [&>*]:transition-all [&>*]:duration-300 flex items-center shadow-xl bg-card gap-0.5 py-1.5 px-3 rounded-full border-2 border-primary/30 overflow-x-auto scrollbar-hide"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-full p-2 px-2.5 cursor-pointer',
                'hover:-translate-y-4 hover:scale-110',
                'before:hidden hover:before:flex before:justify-center before:items-center before:h-4 before:text-[0.55rem] before:font-semibold before:px-1.5 before:bg-foreground before:text-background before:bg-opacity-80 before:absolute before:-top-6 before:rounded-lg before:whitespace-nowrap before:z-50',
                isActive
                  ? 'bg-primary/10 text-primary scale-105 -translate-y-1'
                  : 'bg-card text-muted-foreground',
              )}
              style={{ '--tw-content': `'${label}'` } as React.CSSProperties}
            >
              <span
                className="before:hidden hover:before:flex before:justify-center before:items-center before:h-4 before:text-[0.55rem] before:font-semibold before:px-1.5 before:bg-foreground before:text-background before:absolute before:-top-7 before:rounded-lg before:whitespace-nowrap before:z-50 before:pointer-events-none"
                style={{ position: 'relative' }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.7} />
              </span>
              <span className="text-[8px] font-medium mt-0.5 leading-none">{label}</span>
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
