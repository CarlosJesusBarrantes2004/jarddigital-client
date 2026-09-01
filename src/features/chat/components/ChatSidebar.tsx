import { MessageCircle, Search, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatFilter, ChatRoom } from "../types/chat.types";
import {
  avatarTone,
  formatChatTime,
  initials,
  previewForMessage,
} from "../lib/chat.utils";

interface ChatSidebarProps {
  userName: string;
  rooms: ChatRoom[];
  activeRoomId: number | null;
  search: string;
  filter: ChatFilter;
  canCreateGroups: boolean;
  canAudit: boolean;
  people: { id: number; nombre_completo: string }[];
  onSearch: (value: string) => void;
  onFilter: (value: ChatFilter) => void;
  onSelectRoom: (room: ChatRoom) => void;
  onSelectPerson: (userId: number) => void;
  onNewGroup: () => void;
  onOpenPermissions: () => void;
}

export const ChatSidebar = ({
  userName,
  rooms,
  activeRoomId,
  search,
  filter,
  canCreateGroups,
  canAudit,
  people,
  onSearch,
  onFilter,
  onSelectRoom,
  onSelectPerson,
  onNewGroup,
  onOpenPermissions,
}: ChatSidebarProps) => {
  const filters: { id: ChatFilter; label: string; hidden?: boolean }[] = [
    { id: "todos", label: "Todos" },
    { id: "grupos", label: "Grupos" },
    { id: "privados", label: "Privados" },
    { id: "auditoria", label: "Auditoría Total", hidden: !canAudit },
  ];

  return (
    <aside className="w-full md:w-[360px] shrink-0 border-r border-border bg-card flex flex-col h-full">
      <header className="h-16 px-4 flex items-center justify-between border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9">
            <AvatarFallback className={cn("text-white text-xs", avatarTone(userName))}>
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground">Chat interno</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canCreateGroups && (
            <button
              type="button"
              onClick={onNewGroup}
              className="size-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Nuevo grupo"
            >
              <Users size={18} />
            </button>
          )}
          {canAudit && (
            <button
              type="button"
              onClick={onOpenPermissions}
              className="size-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Permisos y auditoría"
            >
              <Settings2 size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Buscar conversaciones o personas"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/70 border border-transparent focus:border-sky-400/50 focus:bg-background text-[13px] outline-none"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {filters
            .filter((item) => !item.hidden)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilter(item.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                  filter === item.id
                    ? "bg-sky-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {item.label}
              </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 && people.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-6 text-center">
            <MessageCircle size={28} className="mb-2 opacity-50" />
            <p className="text-sm">No hay conversaciones todavía.</p>
          </div>
        )}

        {rooms.map((room) => {
          const active = room.id === activeRoomId;
          const preview = room.last_message
            ? previewForMessage(room.last_message)
            : "Sin mensajes";
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/60 transition-colors",
                active ? "bg-sky-500/10" : "hover:bg-muted/50",
              )}
            >
              <Avatar className="size-11">
                <AvatarFallback
                  className={cn("text-white text-xs", avatarTone(room.display_name))}
                >
                  {room.room_type === "GROUP" ? (
                    <Users size={16} />
                  ) : (
                    initials(room.display_name)
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[14px] font-semibold truncate">
                    {room.display_name}
                  </p>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatChatTime(room.last_message?.created_at || room.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] text-muted-foreground truncate">
                    {preview}
                  </p>
                  {room.unread_count > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {room.unread_count > 99 ? "99+" : room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {people.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Personas
            </p>
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => onSelectPerson(person.id)}
                className="w-full flex items-center gap-3 py-2 rounded-lg hover:bg-muted/60"
              >
                <Avatar className="size-8">
                  <AvatarFallback
                    className={cn("text-white text-[10px]", avatarTone(person.nombre_completo))}
                  >
                    {initials(person.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{person.nombre_completo}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
