import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  username: string;
  avatar?: string;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onSettings: () => void;
  settingsDialog?: React.ReactNode;
}

export const UserProfile = ({
  username,
  avatar,
  isConnected,
  isMuted,
  isDeafened,
  isSpeaking,
  onToggleMute,
  onToggleDeafen,
  onSettings,
  settingsDialog
}: UserProfileProps) => {
  return (
    <div>
      <Card className="p-4 bg-card/50 border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className={cn(
              "w-10 h-10 transition-all duration-300",
              isSpeaking && "ring-2 ring-voice-speaking shadow-glow",
              isConnected && !isSpeaking && "ring-2 ring-voice-connected/50"
            )}>
              <AvatarImage src={avatar} alt={username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card transition-colors",
              isConnected ? "bg-voice-connected" : "bg-muted-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{username}</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Connected" : "Offline"}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              className={cn(
                "flex-1 transition-all",
                isMuted && "bg-voice-muted/20 text-voice-muted hover:bg-voice-muted/30"
              )}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDeafen}
              className={cn(
                "flex-1 transition-all",
                isDeafened && "bg-voice-deafened/20 text-voice-deafened hover:bg-voice-deafened/30"
              )}
            >
              {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {settingsDialog}
          </div>
        )}
      </Card>
    </div>
  );
};