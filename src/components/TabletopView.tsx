import { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoomBuilder, RoomElement } from "@/components/RoomBuilder";
import { useRoomDetection } from "@/hooks/useRoomDetection";

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

interface TabletopViewProps {
  players: Player[];
  currentPlayerId: string;
  onPlayerMove: (playerId: string, x: number, y: number) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  isMuted: boolean;
  isDeafened: boolean;
  proximityRange: number;
  isAdmin: boolean;
}

const PROXIMITY_RANGE = 150; // pixels
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const TabletopView = ({
  players,
  currentPlayerId,
  onPlayerMove,
  onToggleMute,
  onToggleDeafen,
  isMuted,
  isDeafened,
  proximityRange,
  isAdmin
}: TabletopViewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const animationRef = useRef<number>();
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const rooms = useRoomDetection(players, roomElements, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Calculate proximity-based volume with room isolation
  const calculateProximity = useCallback((player1: Player, player2: Player) => {
    // First check if players are in the same room
    const player1Room = rooms.find(room => room.players.some(p => p.id === player1.id));
    const player2Room = rooms.find(room => room.players.some(p => p.id === player2.id));
    
    if (!player1Room || !player2Room || player1Room.id !== player2Room.id) {
      return 0; // Different rooms = no voice connection
    }
    
    const distance = Math.sqrt(
      Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
    );
    
    if (distance > proximityRange) return 0;
    return Math.max(0, 1 - (distance / proximityRange));
  }, [proximityRange, rooms]);

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        setPressedKeys(prev => new Set(prev).add(key));
        setIsMoving(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          if (newSet.size === 0) {
            setIsMoving(false);
          }
          return newSet;
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Animation loop for smooth movement
  useEffect(() => {
    if (!currentPlayer || pressedKeys.size === 0) return;

    const moveSpeed = 3;
    
    const animate = () => {
      let newX = currentPlayer.x;
      let newY = currentPlayer.y;

      if (pressedKeys.has('w')) newY -= moveSpeed;
      if (pressedKeys.has('s')) newY += moveSpeed;
      if (pressedKeys.has('a')) newX -= moveSpeed;
      if (pressedKeys.has('d')) newX += moveSpeed;

      // Boundary checks
      newX = Math.max(25, Math.min(CANVAS_WIDTH - 25, newX));
      newY = Math.max(25, Math.min(CANVAS_HEIGHT - 25, newY));

      if (newX !== currentPlayer.x || newY !== currentPlayer.y) {
        onPlayerMove(currentPlayerId, newX, newY);
      }

      if (pressedKeys.size > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pressedKeys, currentPlayer, currentPlayerId, onPlayerMove]);

  // Handle click-to-move
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPlayer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Boundary checks
    const newX = Math.max(25, Math.min(CANVAS_WIDTH - 25, x));
    const newY = Math.max(25, Math.min(CANVAS_HEIGHT - 25, y));

    onPlayerMove(currentPlayerId, newX, newY);
  };

  // Get players within proximity and same room
  const getPlayersInRange = useCallback(() => {
    if (!currentPlayer) return [];
    
    const currentRoom = rooms.find(room => room.players.some(p => p.id === currentPlayerId));
    if (!currentRoom) return [];
    
    return currentRoom.players.filter(p => {
      if (p.id === currentPlayerId) return false;
      const proximity = calculateProximity(currentPlayer, p);
      return proximity > 0;
    }).map(p => ({
      ...p,
      proximity: calculateProximity(currentPlayer, p)
    }));
  }, [players, currentPlayer, currentPlayerId, calculateProximity, rooms]);

  const playersInRange = getPlayersInRange();

  // Handle knocking on doors
  const handleKnockDoor = (doorId: string, playerId: string) => {
    setRoomElements(prev => prev.map(el => {
      if (el.id === doorId && el.type === 'door') {
        const door = el as any;
        if (!door.knockRequests.includes(playerId)) {
          return { ...door, knockRequests: [...door.knockRequests, playerId] };
        }
      }
      return el;
    }));
  };

  // Get current player's room info
  const currentRoom = rooms.find(room => room.players.some(p => p.id === currentPlayerId));

  return (
    <div className="flex flex-col h-full">
      {/* Controls Header */}
      <div className="p-4 bg-card border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Tabletop Proximity Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {playersInRange.length} nearby
            </Badge>
            {currentRoom && currentRoom.id !== 'room-outside' && (
              <Badge variant="secondary" className="gap-1">
                Room: {currentRoom.id.replace('room-', '')}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Use WASD to move or click to teleport</span>
          <span>•</span>
          <span>Voice proximity range: {proximityRange}px</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-border/50">
            {/* Canvas/Game Area */}
            <div
              ref={canvasRef}
              className="relative bg-gradient-to-br from-muted/20 to-muted/5 cursor-crosshair"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              onClick={handleCanvasClick}
            >
              {/* Enhanced Grid Background */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: '25px 25px'
                }}
              />
              
              {/* Major grid lines */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--border)) 2px, transparent 2px),
                    linear-gradient(90deg, hsl(var(--border)) 2px, transparent 2px)
                  `,
                  backgroundSize: '100px 100px'
                }}
              />

              {/* Proximity Range Indicator for Current Player */}
              {currentPlayer && (
                <div
                  className="absolute border-2 border-accent/30 rounded-full pointer-events-none"
                  style={{
                    left: currentPlayer.x - proximityRange,
                    top: currentPlayer.y - proximityRange,
                    width: proximityRange * 2,
                    height: proximityRange * 2,
                    background: `radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 70%)`
                  }}
                />
              )}

              {/* Players */}
              {players.map((player) => {
                const isCurrentPlayer = player.id === currentPlayerId;
                const proximity = isCurrentPlayer ? 1 : calculateProximity(currentPlayer!, player);
                const isInRange = proximity > 0;

                return (
                  <div
                    key={player.id}
                    className="absolute transition-all duration-200 ease-out"
                    style={{
                      left: player.x - 25,
                      top: player.y - 25,
                      opacity: isCurrentPlayer ? 1 : (isInRange ? 0.8 + proximity * 0.2 : 0.3),
                      transform: `scale(${isCurrentPlayer ? 1.1 : (isInRange ? 0.9 + proximity * 0.2 : 0.8)})`
                    }}
                  >
                    {/* Player Avatar */}
                    <div className="relative">
                      <Avatar className={cn(
                        "w-12 h-12 border-2 transition-all duration-300",
                        isCurrentPlayer && "border-primary shadow-glow",
                        !isCurrentPlayer && isInRange && "border-accent",
                        !isCurrentPlayer && !isInRange && "border-border",
                        player.isSpeaking && "ring-2 ring-voice-speaking shadow-glow",
                        isMoving && isCurrentPlayer && "animate-pulse"
                      )}>
                        <AvatarImage src={player.avatar} alt={player.username} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {player.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Status Indicators */}
                      <div className="absolute -bottom-1 -right-1 flex gap-1">
                        {player.isMuted && (
                          <div className="w-4 h-4 bg-voice-muted rounded-full flex items-center justify-center">
                            <MicOff className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {player.isDeafened && (
                          <div className="w-4 h-4 bg-voice-deafened rounded-full flex items-center justify-center">
                            <VolumeX className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Volume Indicator for nearby players */}
                      {!isCurrentPlayer && isInRange && (
                        <div
                          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent/20 rounded-full overflow-hidden"
                        >
                          <div
                            className="h-full bg-accent transition-all duration-200"
                            style={{ width: `${proximity * 100}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Username */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded bg-card/80 border border-border/50",
                        isCurrentPlayer && "text-primary font-medium",
                        !isCurrentPlayer && isInRange && "text-accent",
                        !isCurrentPlayer && !isInRange && "text-muted-foreground"
                      )}>
                        {player.username}
                        {isCurrentPlayer && " (You)"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Movement Instructions */}
              {currentPlayer && (
                <div className="absolute top-4 left-4 bg-card/90 border border-border/50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-foreground mb-1">Controls</div>
                  <div className="text-muted-foreground space-y-1">
                    <div>WASD: Move around</div>
                    <div>Click: Teleport to location</div>
                  </div>
                </div>
              )}

              {/* Room Builder Component */}
              <RoomBuilder
                isAdmin={isAdmin}
                elements={roomElements}
                onElementsChange={setRoomElements}
                onKnockDoor={handleKnockDoor}
                currentPlayerId={currentPlayerId}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
              />
            </div>
          </Card>

          {/* Voice Controls */}
          <div className="flex justify-center mt-4 gap-3">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              onClick={onToggleMute}
              className="gap-2"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
            
            <Button
              variant={isDeafened ? "destructive" : "outline"}
              onClick={onToggleDeafen}
              className="gap-2"
            >
              {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isDeafened ? "Undeafen" : "Deafen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};