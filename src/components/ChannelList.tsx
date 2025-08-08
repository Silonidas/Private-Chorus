import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoiceChannel } from "./VoiceChannel";
import { Plus, Hash } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  userCount: number;
}

interface ChannelListProps {
  channels: Channel[];
  connectedChannelId?: string;
  onCreateChannel: (name: string) => void;
  onConnectToChannel: (channelId: string) => void;
  onDisconnectFromChannel: () => void;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  roomChannels?: Channel[];
  isTabletopView?: boolean;
}

export const ChannelList = ({
  channels,
  connectedChannelId,
  onCreateChannel,
  onConnectToChannel,
  onDisconnectFromChannel,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  roomChannels = [],
  isTabletopView = false
}: ChannelListProps) => {
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim());
      setNewChannelName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Voice Channels
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="hover:bg-secondary"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isCreating && (
        <Card className="p-3 border-border/50">
          <div className="flex gap-2">
            <Input
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateChannel();
                } else if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewChannelName("");
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim()}
            >
              Create
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {/* Regular channels - only show if not in tabletop view */}
        {!isTabletopView && channels.map((channel) => (
          <VoiceChannel
            key={channel.id}
            channelName={channel.name}
            isConnected={connectedChannelId === channel.id}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onToggleMute={onToggleMute}
            onToggleDeafen={onToggleDeafen}
            onConnect={() => onConnectToChannel(channel.id)}
            onDisconnect={onDisconnectFromChannel}
            userCount={channel.userCount}
          />
        ))}

        {/* Room channels - only show in tabletop view */}
        {isTabletopView && roomChannels.map((channel) => (
          <VoiceChannel
            key={channel.id}
            channelName={`Room ${channel.name}`}
            isConnected={connectedChannelId === channel.id}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onToggleMute={onToggleMute}
            onToggleDeafen={onToggleDeafen}
            onConnect={() => onConnectToChannel(channel.id)}
            onDisconnect={onDisconnectFromChannel}
            userCount={channel.userCount}
          />
        ))}

        {channels.length === 0 && !isCreating && !isTabletopView && (
          <Card className="p-6 text-center border-dashed border-border/50">
            <p className="text-muted-foreground mb-2">No voice channels yet</p>
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create your first channel
            </Button>
          </Card>
        )}

        {isTabletopView && roomChannels.length === 0 && (
          <Card className="p-6 text-center border-dashed border-border/50">
            <p className="text-muted-foreground mb-2">No rooms created yet</p>
            <p className="text-xs text-muted-foreground">Create rooms using the Room Builder tool</p>
          </Card>
        )}
      </div>
    </div>
  );
};