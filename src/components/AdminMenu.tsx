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
import { RoomBuilderControls } from "@/components/RoomBuilderControls";

interface AdminMenuProps {
  onManageUsers: () => void;
  onServerSettings: () => void;
  onModerationTools: () => void;
  onChannelManagement: () => void;
  onRoomBuilder: () => void;
  showRoomBuilder?: boolean;
  roomBuilderActiveTool?: 'wall' | 'door' | 'delete' | null;
  onRoomBuilderToolChange?: (tool: 'wall' | 'door' | 'delete' | null) => void;
  hasBuiltElements?: boolean;
  onFinishBuilding?: () => void;
}

export const AdminMenu = ({
  onManageUsers,
  onServerSettings,
  onModerationTools,
  onChannelManagement,
  onRoomBuilder,
  showRoomBuilder = false,
  roomBuilderActiveTool = null,
  onRoomBuilderToolChange,
  hasBuiltElements = false,
  onFinishBuilding
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
        
        {/* Room Builder Controls - Show when active */}
        {showRoomBuilder && onRoomBuilderToolChange && onFinishBuilding && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <RoomBuilderControls
                activeTool={roomBuilderActiveTool}
                onToolChange={onRoomBuilderToolChange}
                onFinishBuilding={onFinishBuilding}
                hasBuiltElements={hasBuiltElements}
              />
            </div>
          </>
        )}
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