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
  onReplyPrivately,
}: {
  memberName: string;
  onChat: () => void;
  onReplyPrivately?: () => void;
}) => {
  const shortName = firstName(memberName);

  return (
    <DropdownMenuContent 
      align="start" 
      className="min-w-56"
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <DropdownMenuLabel className="font-normal text-muted-foreground truncate max-w-64">
        {memberName}
      </DropdownMenuLabel>
      
      {!onReplyPrivately && (
        <DropdownMenuItem onSelect={onChat} className="items-start">
          <MessageCircle className="mt-0.5 shrink-0" size={16} />
          <div className="flex flex-col ml-2">
            <span>Enviar mensaje a {shortName}</span>
            <span className="text-xs text-muted-foreground">Chatear en privado</span>
          </div>
        </DropdownMenuItem>
      )}

      {onReplyPrivately && (
        <DropdownMenuItem onSelect={onReplyPrivately} className="items-start">
          <MessageCircle className="mt-0.5 shrink-0" size={16} />
          <div className="flex flex-col ml-2">
            <span>Responder en privado</span>
            <span className="text-xs text-muted-foreground">Citar mensaje en chat directo</span>
          </div>
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
};
