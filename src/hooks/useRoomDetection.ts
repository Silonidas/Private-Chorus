import { useMemo } from "react";
import { Wall, Door, RoomElement } from "@/components/RoomBuilder";

interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface Room {
  id: string;
  players: Player[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Ray casting algorithm to determine if point is inside polygon
function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Check if player can pass through a door
function canPassThroughDoor(door: Door, fromX: number, fromY: number, toX: number, toY: number): boolean {
  if (door.isLocked) return false;
  if (!door.isOpen) return false;
  
  // Simple line intersection check with door bounds
  const doorCenterX = door.x + door.width / 2;
  const doorCenterY = door.y + door.height / 2;
  
  // Check if path crosses through door area
  const crossesX = (fromX <= doorCenterX && toX >= doorCenterX) || (fromX >= doorCenterX && toX <= doorCenterX);
  const crossesY = (fromY <= doorCenterY && toY >= doorCenterY) || (fromY >= doorCenterY && toY <= doorCenterY);
  
  return crossesX && crossesY;
}

// Detect rooms based on walls and doors
function detectRooms(elements: RoomElement[], canvasWidth: number, canvasHeight: number): Room[] {
  const walls = elements.filter(el => el.type === 'wall') as Wall[];
  const doors = elements.filter(el => el.type === 'door') as Door[];
  
  // For simplicity, we'll use a grid-based approach to detect enclosed areas
  // In a production app, you'd use more sophisticated polygon detection
  
  const gridSize = 20;
  const roomGrid: number[][] = [];
  
  // Initialize grid
  for (let y = 0; y < Math.ceil(canvasHeight / gridSize); y++) {
    roomGrid[y] = [];
    for (let x = 0; x < Math.ceil(canvasWidth / gridSize); x++) {
      roomGrid[y][x] = 0; // 0 = empty, 1 = wall, 2+ = room ID
    }
  }
  
  // Mark walls on grid
  walls.forEach(wall => {
    const steps = Math.max(Math.abs(wall.x2 - wall.x1), Math.abs(wall.y2 - wall.y1));
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor((wall.x1 + (wall.x2 - wall.x1) * (i / steps)) / gridSize);
      const y = Math.floor((wall.y1 + (wall.y2 - wall.y1) * (i / steps)) / gridSize);
      if (x >= 0 && x < roomGrid[0].length && y >= 0 && y < roomGrid.length) {
        roomGrid[y][x] = 1;
      }
    }
  });
  
  // Mark doors as passable (for now, treat as empty for room detection)
  doors.forEach(door => {
    if (!door.isLocked || door.isOpen) {
      const startX = Math.floor(door.x / gridSize);
      const startY = Math.floor(door.y / gridSize);
      const endX = Math.floor((door.x + door.width) / gridSize);
      const endY = Math.floor((door.y + door.height) / gridSize);
      
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          if (x >= 0 && x < roomGrid[0].length && y >= 0 && y < roomGrid.length) {
            roomGrid[y][x] = 0; // Passable
          }
        }
      }
    }
  });
  
  // Flood fill to detect connected areas (rooms)
  let roomId = 2;
  const rooms: Room[] = [];
  
  for (let y = 0; y < roomGrid.length; y++) {
    for (let x = 0; x < roomGrid[0].length; x++) {
      if (roomGrid[y][x] === 0) {
        const roomCells: { x: number; y: number }[] = [];
        const stack: { x: number; y: number }[] = [{ x, y }];
        
        while (stack.length > 0) {
          const current = stack.pop()!;
          if (
            current.x < 0 || current.x >= roomGrid[0].length ||
            current.y < 0 || current.y >= roomGrid.length ||
            roomGrid[current.y][current.x] !== 0
          ) {
            continue;
          }
          
          roomGrid[current.y][current.x] = roomId;
          roomCells.push(current);
          
          stack.push(
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
          );
        }
        
        if (roomCells.length > 10) { // Minimum room size
          const bounds = {
            minX: Math.min(...roomCells.map(c => c.x)) * gridSize,
            maxX: Math.max(...roomCells.map(c => c.x)) * gridSize + gridSize,
            minY: Math.min(...roomCells.map(c => c.y)) * gridSize,
            maxY: Math.max(...roomCells.map(c => c.y)) * gridSize + gridSize,
          };
          
          rooms.push({
            id: `room-${roomId}`,
            players: [],
            bounds
          });
        }
        
        roomId++;
      }
    }
  }
  
  // Add default "outside" room for areas not enclosed
  rooms.unshift({
    id: 'room-outside',
    players: [],
    bounds: {
      minX: 0,
      maxX: canvasWidth,
      minY: 0,
      maxY: canvasHeight
    }
  });
  
  return rooms;
}

export function useRoomDetection(
  players: Player[],
  elements: RoomElement[],
  canvasWidth: number,
  canvasHeight: number
) {
  return useMemo(() => {
    const rooms = detectRooms(elements, canvasWidth, canvasHeight);
    
    // Assign players to rooms based on their position
    const updatedRooms = rooms.map(room => ({
      ...room,
      players: players.filter(player => {
        // Check if player is in this room's bounds
        return (
          player.x >= room.bounds.minX &&
          player.x <= room.bounds.maxX &&
          player.y >= room.bounds.minY &&
          player.y <= room.bounds.maxY
        );
      })
    }));
    
    return updatedRooms;
  }, [players, elements, canvasWidth, canvasHeight]);
}

export { type Room };