import { useState } from "react";
import { ChannelList } from "@/components/ChannelList";
import { UserProfile } from "@/components/UserProfile";
import { TabletopView } from "@/components/TabletopView";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AdminMenu } from "@/components/AdminMenu";
import { UniversalChat } from "@/components/UniversalChat";
import { RoomBuilderControls } from "@/components/RoomBuilderControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic2, Settings, Users, Globe, Map, Hash, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  userCount: number;
}

interface Player {
  id: string;
  username: string;
  avatar?: string;
  x: number;
  y: number;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"channels" | "tabletop">("channels");
  const [channels, setChannels] = useState<Channel[]>([
    { id: "1", name: "General", userCount: 3 },
    { id: "2", name: "Gaming", userCount: 1 },
  ]);
  const [connectedChannelId, setConnectedChannelId] = useState<string>();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Settings state
  const [proximityRange, setProximityRange] = useState(150);
  const [audioInputGain, setAudioInputGain] = useState(100);
  const [audioOutputVolume, setAudioOutputVolume] = useState(80);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  
  // User admin status (would come from authentication in real app)
  const [isAdmin, setIsAdmin] = useState(true);
  
  // Chat state
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  // Room builder state
  const [showRoomBuilder, setShowRoomBuilder] = useState(false);
  const [roomChannels, setRoomChannels] = useState<Channel[]>([]);
  const [roomBuilderActiveTool, setRoomBuilderActiveTool] = useState<'wall' | 'door' | 'delete' | null>(null);
  
  // Tabletop view state
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "you",
      username: "You",
      x: 400,
      y: 300,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false
    },
    {
      id: "player1",
      username: "Alice",
      x: 200,
      y: 150,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false
    },
    {
      id: "player2",
      username: "Bob",
      x: 600,
      y: 450,
      isMuted: true,
      isDeafened: false,
      isSpeaking: false
    }
  ]);

  const handleCreateChannel = (name: string) => {
    const newChannel: Channel = {
      id: Date.now().toString(),
      name,
      userCount: 0,
    };
    setChannels(prev => [...prev, newChannel]);
    toast({
      title: "Channel Created",
      description: `Voice channel "${name}" has been created.`,
    });
  };

  const handleConnectToChannel = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setConnectedChannelId(channelId);
      setChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, userCount: c.userCount + 1 }
          : c
      ));
      toast({
        title: "Connected",
        description: `Connected to "${channel.name}" voice channel.`,
      });
    }
  };

  const handleDisconnectFromChannel = () => {
    if (connectedChannelId) {
      const channel = channels.find(c => c.id === connectedChannelId);
      setChannels(prev => prev.map(c => 
        c.id === connectedChannelId 
          ? { ...c, userCount: Math.max(0, c.userCount - 1) }
          : c
      ));
      setConnectedChannelId(undefined);
      setIsMuted(false);
      setIsDeafened(false);
      toast({
        title: "Disconnected",
        description: channel ? `Disconnected from "${channel.name}" voice channel.` : "Disconnected from voice channel.",
      });
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Your microphone is now active." : "Your microphone is now muted.",
    });
  };

  const handleToggleDeafen = () => {
    setIsDeafened(prev => !prev);
    if (!isDeafened) {
      setIsMuted(true);
    }
    
    // Update player state if in tabletop view
    if (activeView === "tabletop") {
      setPlayers(prev => prev.map(p => 
        p.id === "you" 
          ? { ...p, isDeafened: !isDeafened, isMuted: !isDeafened ? true : p.isMuted }
          : p
      ));
    }
    
    toast({
      title: isDeafened ? "Undeafened" : "Deafened",
      description: isDeafened ? "You can now hear other users." : "You can no longer hear other users.",
    });
  };

  // Tabletop view handlers
  const handlePlayerMove = (playerId: string, x: number, y: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, x, y } : p
    ));
  };

  const handleTabletopToggleMute = () => {
    setIsMuted(prev => !prev);
    setPlayers(prev => prev.map(p => 
      p.id === "you" ? { ...p, isMuted: !isMuted } : p
    ));
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Your microphone is now active." : "Your microphone is now muted.",
    });
  };

  const handleTabletopToggleDeafen = () => {
    setIsDeafened(prev => !prev);
    const newDeafened = !isDeafened;
    setPlayers(prev => prev.map(p => 
      p.id === "you" 
        ? { ...p, isDeafened: newDeafened, isMuted: newDeafened ? true : p.isMuted }
        : p
    ));
    if (newDeafened) {
      setIsMuted(true);
    }
    toast({
      title: newDeafened ? "Deafened" : "Undeafened",
      description: newDeafened ? "You can no longer hear other users." : "You can now hear other users.",
    });
  };

  // Admin handlers
  const handleManageUsers = () => {
    toast({
      title: "User Management",
      description: "User management panel would open here.",
    });
  };

  const handleServerSettings = () => {
    toast({
      title: "Server Settings",
      description: "Server settings panel would open here.",
    });
  };

  const handleModerationTools = () => {
    toast({
      title: "Moderation Tools",
      description: "Moderation tools panel would open here.",
    });
  };

  const handleChannelManagement = () => {
    toast({
      title: "Channel Management",
      description: "Channel management panel would open here.",
    });
  };

  const handleRoomBuilder = () => {
    setActiveView("tabletop");
    setShowRoomBuilder(!showRoomBuilder);
    toast({
      title: showRoomBuilder ? "Room Builder Disabled" : "Room Builder Enabled",
      description: showRoomBuilder ? "Room building mode is now off." : "Room building mode is now active.",
    });
  };

  const handleRoomCreated = (roomId: string) => {
    const roomNumber = roomChannels.length + 1;
    const newRoomChannel: Channel = {
      id: roomId,
      name: roomNumber.toString(),
      userCount: 0
    };
    setRoomChannels(prev => [...prev, newRoomChannel]);
    toast({
      title: "Room Created",
      description: `Room ${roomNumber} has been created and is now available as a channel.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">VoiceChat</h1>
                <p className="text-xs text-sidebar-foreground/70">Self-hosted voice chat</p>
              </div>
            </div>

            {/* View Toggle */}
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "channels" | "tabletop")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="channels" className="gap-2">
                  <Hash className="w-4 h-4" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="tabletop" className="gap-2">
                  <Map className="w-4 h-4" />
                  Tabletop
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content based on active view */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeView === "channels" ? (
              <ChannelList
                channels={channels}
                connectedChannelId={connectedChannelId}
                onCreateChannel={handleCreateChannel}
                onConnectToChannel={handleConnectToChannel}
                onDisconnectFromChannel={handleDisconnectFromChannel}
                isMuted={isMuted}
                isDeafened={isDeafened}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
              />
            ) : (
              <ChannelList
                channels={channels}
                connectedChannelId={connectedChannelId}
                onCreateChannel={handleCreateChannel}
                onConnectToChannel={handleConnectToChannel}
                onDisconnectFromChannel={handleDisconnectFromChannel}
                isMuted={isMuted}
                isDeafened={isDeafened}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
                roomChannels={roomChannels}
                isTabletopView={true}
              />
            )}
          </div>

          <Separator className="bg-sidebar-border" />

          {/* User Profile */}
          <div className="p-4">
            <UserProfile
              username="You"
              isConnected={!!connectedChannelId}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isSpeaking={isSpeaking}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onSettings={() => {}}
              isAdmin={isAdmin}
              settingsDialog={
                <SettingsDialog
                  proximityRange={proximityRange}
                  onProximityRangeChange={setProximityRange}
                  audioInputGain={audioInputGain}
                  onAudioInputGainChange={setAudioInputGain}
                  audioOutputVolume={audioOutputVolume}
                  onAudioOutputVolumeChange={setAudioOutputVolume}
                  echoCancellation={echoCancellation}
                  onEchoCancellationChange={setEchoCancellation}
                  noiseSuppression={noiseSuppression}
                  onNoiseSuppressionChange={setNoiseSuppression}
                />
              }
              adminMenu={
                <AdminMenu
                  onManageUsers={handleManageUsers}
                  onServerSettings={handleServerSettings}
                  onModerationTools={handleModerationTools}
                  onChannelManagement={handleChannelManagement}
                  onRoomBuilder={handleRoomBuilder}
                  showRoomBuilder={showRoomBuilder}
                  roomBuilderActiveTool={roomBuilderActiveTool}
                  onRoomBuilderToolChange={setRoomBuilderActiveTool}
                  hasBuiltElements={roomChannels.length > 0}
                  onFinishBuilding={() => {
                    setShowRoomBuilder(false);
                    setRoomBuilderActiveTool(null);
                    toast({
                      title: "Room Building Complete",
                      description: "Your room has been saved and is now available.",
                    });
                  }}
                />
              }
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {activeView === "channels" ? (
                connectedChannelId ? (
                  <>
                    <div className="w-3 h-3 bg-voice-connected rounded-full animate-pulse" />
                    <span className="font-medium text-foreground">
                      Connected to {channels.find(c => c.id === connectedChannelId)?.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Not connected</span>
                  </>
                )
              ) : (
                <>
                  <Map className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">Tabletop Proximity Chat</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col relative">

            {activeView === "channels" ? (
              <div className="h-full p-6 flex items-center justify-center">
                {!connectedChannelId ? (
                  <Card className="p-8 text-center max-w-md mx-auto border-border/50">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic2 className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Welcome to VoiceChat
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      A self-hosted voice chat application built with modern web technologies. Connect to a voice channel to start chatting with friends.
                    </p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full" />
                        Low-latency Opus audio codec
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full" />
                        WebRTC peer-to-peer connections
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full" />
                        End-to-end encrypted communication
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                      <Mic2 className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Voice Chat Active
                    </h2>
                    <p className="text-muted-foreground">
                      You are connected to the voice channel. Audio controls are available in the sidebar.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <TabletopView
                players={players}
                currentPlayerId="you"
                onPlayerMove={handlePlayerMove}
                onToggleMute={handleTabletopToggleMute}
                onToggleDeafen={handleTabletopToggleDeafen}
                isMuted={isMuted}
                isDeafened={isDeafened}
                proximityRange={proximityRange}
                isAdmin={isAdmin}
                showRoomBuilder={showRoomBuilder}
                onRoomCreated={handleRoomCreated}
                activeTool={roomBuilderActiveTool}
                onToolChange={setRoomBuilderActiveTool}
                hasBuiltElements={roomChannels.length > 0}
                onFinishBuilding={() => {
                  setShowRoomBuilder(false);
                  setRoomBuilderActiveTool(null);
                  toast({
                    title: "Room Building Complete",
                    description: "Your room has been saved and is now available.",
                  });
                }}
              />
            )}
          </div>

          {/* Universal Chat - Horizontal at bottom */}
          <div className={cn(
            "transition-all duration-300 border-t border-border/50",
            isChatMinimized ? "fixed bottom-4 right-4 z-50" : "h-48"
          )}>
            <UniversalChat
              currentUserId="you"
              currentUsername="You"
              channelId={activeView === "channels" ? connectedChannelId : undefined}
              roomId={activeView === "tabletop" ? "tabletop" : undefined}
              isMinimized={isChatMinimized}
              onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
              className={isChatMinimized ? "w-12 h-12" : "h-full"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
