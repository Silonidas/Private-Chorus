import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Square, 
  DoorOpen, 
  DoorClosed, 
  Lock, 
  Unlock, 
  Trash2, 
  Hand,
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'wall';
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked: boolean;
  isOpen: boolean;
  orientation: 'horizontal' | 'vertical';
  type: 'door';
  knockRequests: string[]; // player IDs who have knocked
}

export type RoomElement = Wall | Door;

interface RoomBuilderProps {
  isAdmin: boolean;
  elements: RoomElement[];
  onElementsChange: (elements: RoomElement[]) => void;
  onKnockDoor: (doorId: string, playerId: string) => void;
  currentPlayerId: string;
  canvasWidth: number;
  canvasHeight: number;
  onBuildingStateChange: (isBuilding: boolean) => void;
}

type BuildTool = 'wall' | 'door' | 'delete' | null;

const GRID_SIZE = 25;

export const RoomBuilder = ({
  isAdmin,
  elements,
  onElementsChange,
  onKnockDoor,
  currentPlayerId,
  canvasWidth,
  canvasHeight,
  onBuildingStateChange
}: RoomBuilderProps) => {
  const [activeTool, setActiveTool] = useState<BuildTool>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStart, setBuildStart] = useState<{ x: number; y: number } | null>(null);
  const [currentPreview, setCurrentPreview] = useState<{ x: number; y: number } | null>(null);
  
  // Notify parent when building state changes
  const updateBuildingState = (building: boolean) => {
    setIsBuilding(building);
    onBuildingStateChange(building || activeTool !== null);
  };

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !activeTool || activeTool === 'delete') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);

    updateBuildingState(true);
    setBuildStart({ x, y });
    setCurrentPreview({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !activeTool || !isBuilding || !buildStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);

    setCurrentPreview({ x, y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !activeTool || !isBuilding || !buildStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);

    // Don't create elements if start and end are the same
    if (buildStart.x === x && buildStart.y === y) {
      updateBuildingState(false);
      setBuildStart(null);
      setCurrentPreview(null);
      return;
    }

    if (activeTool === 'wall') {
      const newWall: Wall = {
        id: `wall-${Date.now()}`,
        x1: buildStart.x,
        y1: buildStart.y,
        x2: x,
        y2: y,
        type: 'wall'
      };
      onElementsChange([...elements, newWall]);
    } else if (activeTool === 'door') {
      const width = Math.abs(x - buildStart.x);
      const height = Math.abs(y - buildStart.y);
      
      // Snap to grid boundaries - ensure at least one grid unit
      const snappedWidth = Math.max(GRID_SIZE, Math.round(width / GRID_SIZE) * GRID_SIZE);
      const snappedHeight = Math.max(GRID_SIZE, Math.round(height / GRID_SIZE) * GRID_SIZE);
      
      // Ensure minimum door size of one grid unit
      if (snappedWidth < GRID_SIZE && snappedHeight < GRID_SIZE) {
        updateBuildingState(false);
        setBuildStart(null);
        setCurrentPreview(null);
        return;
      }
      
      const orientation = snappedWidth > snappedHeight ? 'horizontal' : 'vertical';
      
      const newDoor: Door = {
        id: `door-${Date.now()}`,
        x: Math.min(buildStart.x, x),
        y: Math.min(buildStart.y, y),
        width: snappedWidth,
        height: snappedHeight,
        isLocked: false,
        isOpen: false,
        orientation,
        type: 'door',
        knockRequests: []
      };
      onElementsChange([...elements, newDoor]);
    }

    updateBuildingState(false);
    setBuildStart(null);
    setCurrentPreview(null);
    setActiveTool(null);
  };

  const handleElementClick = (element: RoomElement, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isAdmin && activeTool === 'delete') {
      onElementsChange(elements.filter(el => el.id !== element.id));
      return;
    }

    if (element.type === 'door') {
      const door = element as Door;
      
      if (isAdmin) {
        // Admin can toggle lock/unlock
        const updatedElements = elements.map(el => 
          el.id === door.id 
            ? { ...door, isLocked: !door.isLocked, isOpen: door.isLocked ? false : door.isOpen }
            : el
        );
        onElementsChange(updatedElements);
      } else {
        // User can knock on locked doors or pass through unlocked ones
        if (door.isLocked) {
          onKnockDoor(door.id, currentPlayerId);
        } else {
          // Toggle door open/closed
          const updatedElements = elements.map(el => 
            el.id === door.id 
              ? { ...door, isOpen: !door.isOpen }
              : el
          );
          onElementsChange(updatedElements);
        }
      }
    }
  };

  const clearKnockRequests = (doorId: string) => {
    const updatedElements = elements.map(el => 
      el.id === doorId && el.type === 'door'
        ? { ...el, knockRequests: [] }
        : el
    );
    onElementsChange(updatedElements);
  };

  // Render preview while building
  const renderPreview = () => {
    if (!buildStart || !currentPreview || !activeTool || activeTool === 'delete') return null;

    if (activeTool === 'wall') {
      return (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasWidth, height: canvasHeight }}>
          <line
            x1={buildStart.x}
            y1={buildStart.y}
            x2={currentPreview.x}
            y2={currentPreview.y}
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeDasharray="8,8"
            opacity={0.7}
          />
        </svg>
      );
    }

    if (activeTool === 'door') {
      const width = Math.abs(currentPreview.x - buildStart.x);
      const height = Math.abs(currentPreview.y - buildStart.y);
      
      // Snap to grid boundaries - always show at least one grid square
      const snappedWidth = Math.max(GRID_SIZE, Math.round(width / GRID_SIZE) * GRID_SIZE);
      const snappedHeight = Math.max(GRID_SIZE, Math.round(height / GRID_SIZE) * GRID_SIZE);
      
      return (
        <div
          className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
          style={{
            left: Math.min(buildStart.x, currentPreview.x),
            top: Math.min(buildStart.y, currentPreview.y),
            width: snappedWidth,
            height: snappedHeight
          }}
        />
      );
    }
  };

  if (!isAdmin) {
    // Non-admin users only see knock notifications
    const doorsWithKnocks = elements.filter(el => 
      el.type === 'door' && (el as Door).knockRequests.length > 0
    ) as Door[];

    if (doorsWithKnocks.length === 0) return null;

    return (
      <div className="absolute top-4 right-4 space-y-2">
        {doorsWithKnocks.map(door => (
          <Card key={door.id} className="p-2 bg-card/90 border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Hand className="w-4 h-4 text-accent" />
              <span>Someone is knocking</span>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Admin Build Tools */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-3 bg-card/90 border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Room Builder</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={activeTool === 'wall' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newTool = activeTool === 'wall' ? null : 'wall';
                setActiveTool(newTool);
                onBuildingStateChange(newTool !== null);
              }}
            >
              <Square className="w-4 h-4" />
            </Button>
            
            <Button
              variant={activeTool === 'door' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newTool = activeTool === 'door' ? null : 'door';
                setActiveTool(newTool);
                onBuildingStateChange(newTool !== null);
              }}
            >
              <DoorOpen className="w-4 h-4" />
            </Button>
            
            <Button
              variant={activeTool === 'delete' ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                const newTool = activeTool === 'delete' ? null : 'delete';
                setActiveTool(newTool);
                onBuildingStateChange(newTool !== null);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {activeTool && (
            <div className="mt-2 text-xs text-muted-foreground">
              {activeTool === 'wall' && "Click and drag to create walls"}
              {activeTool === 'door' && "Click and drag to create doors"}
              {activeTool === 'delete' && "Click elements to delete them"}
            </div>
          )}
        </Card>
      </div>

      {/* Knock Notifications */}
      {elements.some(el => el.type === 'door' && (el as Door).knockRequests.length > 0) && (
        <div className="absolute top-4 left-4 space-y-2 z-10">
          {elements.filter(el => el.type === 'door' && (el as Door).knockRequests.length > 0).map(door => {
            const doorEl = door as Door;
            return (
              <Card key={door.id} className="p-3 bg-card/90 border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Hand className="w-4 h-4 text-accent animate-bounce" />
                    <div>
                      <div className="text-sm font-medium">Door Knock</div>
                      <div className="text-xs text-muted-foreground">
                        {doorEl.knockRequests.length} user(s) waiting
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedElements = elements.map(el => 
                          el.id === door.id 
                            ? { ...doorEl, isLocked: false, isOpen: true }
                            : el
                        );
                        onElementsChange(updatedElements);
                        clearKnockRequests(door.id);
                      }}
                    >
                      <Unlock className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearKnockRequests(door.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Canvas Overlay for Building */}
      <div
        className={cn(
          "absolute inset-0",
          activeTool && "cursor-crosshair"
        )}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Render Preview */}
        {renderPreview()}

        {/* Render Walls */}
        {elements.filter(el => el.type === 'wall').map(wall => {
          const w = wall as Wall;
          return (
            <svg
              key={w.id}
              className="absolute inset-0 pointer-events-none"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              <line
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                stroke="hsl(var(--border))"
                strokeWidth="4"
                className={cn(
                  "pointer-events-auto cursor-pointer",
                  activeTool === 'delete' && "stroke-destructive"
                )}
                onClick={(e) => handleElementClick(w, e as any)}
              />
            </svg>
          );
        })}

        {/* Render Doors */}
        {elements.filter(el => el.type === 'door').map(door => {
          const d = door as Door;
          return (
            <div
              key={d.id}
              className={cn(
                "absolute border-2 transition-all cursor-pointer",
                d.isLocked ? "border-destructive bg-destructive/20" : "border-accent bg-accent/20",
                d.isOpen && !d.isLocked && "bg-accent/10 border-dashed",
                activeTool === 'delete' && "border-destructive bg-destructive/40"
              )}
              style={{
                left: d.x,
                top: d.y,
                width: d.width,
                height: d.height
              }}
              onClick={(e) => handleElementClick(d, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {d.isLocked ? (
                  <Lock className="w-4 h-4 text-destructive" />
                ) : d.isOpen ? (
                  <DoorOpen className="w-4 h-4 text-accent" />
                ) : (
                  <DoorClosed className="w-4 h-4 text-accent" />
                )}
              </div>
              
              {d.knockRequests.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                >
                  {d.knockRequests.length}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
