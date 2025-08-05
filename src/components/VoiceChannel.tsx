import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceChannelProps {
  channelName: string;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  userCount: number;
}

export const VoiceChannel = ({
  channelName,
  isConnected,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onConnect,
  onDisconnect,
  userCount
}: VoiceChannelProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-300 border-border/50 hover:border-accent/50 group cursor-pointer",
        isConnected && "ring-2 ring-voice-connected/30 border-voice-connected/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isConnected ? onDisconnect : onConnect}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className={cn(
            "w-5 h-5 transition-colors",
            isConnected ? "text-voice-connected" : "text-muted-foreground"
          )} />
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
            {channelName}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{userCount}</span>
        </div>
      </div>

      {isConnected && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className={cn(
              "transition-all",
              isMuted && "bg-voice-muted/20 border-voice-muted text-voice-muted hover:bg-voice-muted/30"
            )}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDeafen();
            }}
            className={cn(
              "transition-all",
              isDeafened && "bg-voice-deafened/20 border-voice-deafened text-voice-deafened hover:bg-voice-deafened/30"
            )}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};