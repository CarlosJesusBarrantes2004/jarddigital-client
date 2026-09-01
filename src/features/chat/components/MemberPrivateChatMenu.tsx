import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { firstName } from "../lib/chat.utils";

interface MemberPrivateChatMenuProps {
  memberName: string;
  disabled?: boolean;
  children: ReactNode;
  onChat: () => void;
}

export const MemberPrivateChatMenu = ({
  memberName,
  disabled,
  children,
  onChat,
}: MemberPrivateChatMenuProps) => {
  if (disabled) return children;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <PrivateChatMenuContent memberName={memberName} onChat={onChat} />
    </DropdownMenu>
  );
};

export const PrivateChatMenuContent = ({
  memberName,
  onChat,
}: {
  memberName: string;
  onChat: () => void;
}) => {
  const shortName = firstName(memberName);

  return (
    <DropdownMenuContent align="start" className="min-w-56">
      <DropdownMenuLabel className="font-normal text-muted-foreground truncate max-w-64">
        {memberName}
      </DropdownMenuLabel>
      <DropdownMenuItem onSelect={onChat} className="items-start">
        <MessageCircle className="mt-0.5" />
        <span className="flex flex-col">
          <span>Enviar mensaje a {shortName}</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Chatear en privado
          </span>
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};
