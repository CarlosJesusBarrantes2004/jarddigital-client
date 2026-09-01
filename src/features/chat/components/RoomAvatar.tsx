import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatRoom } from "../types/chat.types";
import { avatarTone, initials } from "../lib/chat.utils";

interface RoomAvatarProps {
  room: Pick<ChatRoom, "display_name" | "room_type" | "image_url">;
  className?: string;
  iconSize?: number;
}

export const RoomAvatar = ({
  room,
  className,
  iconSize = 16,
}: RoomAvatarProps) => {
  const isGroup = room.room_type === "GROUP";
  return (
    <Avatar className={className}>
      {isGroup && room.image_url ? (
        <AvatarImage src={room.image_url} alt={room.display_name} />
      ) : null}
      <AvatarFallback
        className={cn("text-white text-xs", avatarTone(room.display_name))}
      >
        {isGroup ? <Users size={iconSize} /> : initials(room.display_name)}
      </AvatarFallback>
    </Avatar>
  );
};
