import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Square, 
  DoorOpen, 
  Trash2, 
  Shield 
} from "lucide-react";

interface RoomBuilderControlsProps {
  activeTool: 'wall' | 'door' | 'delete' | null;
  onToolChange: (tool: 'wall' | 'door' | 'delete' | null) => void;
}

export const RoomBuilderControls = ({
  activeTool,
  onToolChange
}: RoomBuilderControlsProps) => {
  return (
    <Card className="p-3 bg-card/90 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Room Builder</span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={activeTool === 'wall' ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange(activeTool === 'wall' ? null : 'wall')}
        >
          <Square className="w-4 h-4" />
        </Button>
        
        <Button
          variant={activeTool === 'door' ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange(activeTool === 'door' ? null : 'door')}
        >
          <DoorOpen className="w-4 h-4" />
        </Button>
        
        <Button
          variant={activeTool === 'delete' ? "destructive" : "outline"}
          size="sm"
          onClick={() => onToolChange(activeTool === 'delete' ? null : 'delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {activeTool && (
        <div className="mt-2 text-xs text-muted-foreground">
          {activeTool === 'wall' && "Click and drag to create a room"}
          {activeTool === 'door' && "Click and drag to create doors"}
          {activeTool === 'delete' && "Click elements to delete them"}
        </div>
      )}
    </Card>
  );
};