import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Users, Settings, Ban, Crown, Hammer } from "lucide-react";

interface AdminMenuProps {
  onManageUsers: () => void;
  onServerSettings: () => void;
  onModerationTools: () => void;
  onChannelManagement: () => void;
  onRoomBuilder: () => void;
}

export const AdminMenu = ({
  onManageUsers,
  onServerSettings,
  onModerationTools,
  onChannelManagement,
  onRoomBuilder
}: AdminMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <Shield className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          Admin Panel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onManageUsers}>
          <Users className="w-4 h-4 mr-2" />
          Manage Users
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChannelManagement}>
          <Settings className="w-4 h-4 mr-2" />
          Channel Management
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRoomBuilder}>
          <Hammer className="w-4 h-4 mr-2" />
          Room Builder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onModerationTools}>
          <Ban className="w-4 h-4 mr-2" />
          Moderation Tools
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onServerSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Server Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};