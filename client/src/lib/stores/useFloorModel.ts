import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { 
  Entity, 
  EntityType, 
  FloorSystem, 
  Beam, 
  DrawingFloor, 
  DrawingBeam 
} from "../../types";

interface FloorModelState {
  // Entities
  floors: FloorSystem[];
  beams: Beam[];
  
  // Selection and drawing state
  selectedEntity: Entity | null;
  mode: 'select' | 'floor' | 'beam';
  previewFloor: DrawingFloor | null;
  previewBeam: DrawingBeam | null;
  
  // Action methods
  setMode: (mode: 'select' | 'floor' | 'beam') => void;
  setSelectedEntity: (entity: Entity | null) => void;
  
  // Floor system methods
  addFloorSystem: (floor: Omit<FloorSystem, 'id' | 'type'>) => void;
  updateFloorSystem: (id: string, floor: FloorSystem) => void;
  deleteFloorSystem: (id: string) => void;
  
  // Beam methods
  addBeam: (beam: Omit<Beam, 'id' | 'type'>) => void;
  updateBeam: (id: string, beam: Beam) => void;
  deleteBeam: (id: string) => void;
  
  // Drawing methods
  startDrawingFloor: (floor: DrawingFloor) => void;
  setPreviewFloor: (floor: DrawingFloor | null) => void;
  endDrawingFloor: () => void;
  
  startDrawingBeam: (beam: DrawingBeam) => void;
  setPreviewBeam: (beam: DrawingBeam | null) => void;
  endDrawingBeam: () => void;
  
  // Utility methods
  moveSelectedEntity: (deltaX: number, deltaY: number) => void;
  deleteSelectedEntity: () => void;
  clearAllEntities: () => void;
}

export const useFloorModel = create<FloorModelState>((set, get) => ({
  // Initial state
  floors: [],
  beams: [],
  selectedEntity: null,
  mode: 'select',
  previewFloor: null,
  previewBeam: null,
  
  // Set the current mode (select, floor, beam)
  setMode: (mode) => set({ mode }),
  
  // Set the selected entity
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  
  // Add a new floor system
  addFloorSystem: (floor) => {
    // Check if the floor overlaps with existing floors by more than 1 grid unit (12")
    const { floors } = get();
    
    // Create a slightly expanded rectangle for checking max overlap
    const expandedRect = {
      x: floor.x - 12,
      y: floor.y - 12,
      width: floor.width + 24,
      height: floor.height + 24
    };
    
    // Check for excessive overlap
    const hasExcessiveOverlap = floors.some(existingFloor => {
      // Calculate overlap area
      const overlapX = Math.max(0, Math.min(floor.x + floor.width, existingFloor.x + existingFloor.width) - Math.max(floor.x, existingFloor.x));
      const overlapY = Math.max(0, Math.min(floor.y + floor.height, existingFloor.y + existingFloor.height) - Math.max(floor.y, existingFloor.y));
      
      // If overlap is more than 12" in both directions, it's excessive
      return overlapX > 12 && overlapY > 12;
    });
    
    if (hasExcessiveOverlap) {
      console.warn("Floor systems cannot overlap by more than 12 inches in any direction");
      return;
    }
    
    const newFloor: FloorSystem = {
      id: uuidv4(),
      type: EntityType.Floor,
      ...floor,
      joistDirection: 'x',
      joistDepth: 24,
      joistSpacing: 12,
      systemDepth: 24
    };
    
    set(state => ({
      floors: [...state.floors, newFloor],
      selectedEntity: newFloor
    }));
  },
  
  // Update an existing floor system
  updateFloorSystem: (id, updatedFloor) => {
    set(state => ({
      floors: state.floors.map(floor => 
        floor.id === id ? updatedFloor : floor
      ),
      selectedEntity: updatedFloor
    }));
  },
  
  // Delete a floor system
  deleteFloorSystem: (id) => {
    // Also delete any beams that are connected to this floor
    const { beams } = get();
    const connectedBeams = beams.filter(beam => {
      // Check if the beam starts or ends on the floor perimeter
      const floor = get().floors.find(f => f.id === id);
      if (!floor) return false;
      
      const isOnFloorX = (x: number) => x === floor.x || x === floor.x + floor.width;
      const isOnFloorY = (y: number) => y === floor.y || y === floor.y + floor.height;
      
      const startOnFloor = (isOnFloorX(beam.startX) && isOnFloorY(beam.startY));
      const endOnFloor = (isOnFloorX(beam.endX) && isOnFloorY(beam.endY));
      
      return startOnFloor || endOnFloor;
    });
    
    // Delete the floor and connected beams
    set(state => ({
      floors: state.floors.filter(floor => floor.id !== id),
      beams: state.beams.filter(beam => !connectedBeams.includes(beam)),
      selectedEntity: state.selectedEntity?.id === id ? null : state.selectedEntity
    }));
  },
  
  // Add a new beam
  addBeam: (beam) => {
    const newBeam: Beam = {
      id: uuidv4(),
      type: EntityType.Beam,
      ...beam,
      width: 6,  // Default 6"
      depth: 24  // Default 24"
    };
    
    set(state => ({
      beams: [...state.beams, newBeam],
      selectedEntity: newBeam
    }));
  },
  
  // Update an existing beam
  updateBeam: (id, updatedBeam) => {
    set(state => ({
      beams: state.beams.map(beam => 
        beam.id === id ? updatedBeam : beam
      ),
      selectedEntity: updatedBeam
    }));
  },
  
  // Delete a beam
  deleteBeam: (id) => {
    set(state => ({
      beams: state.beams.filter(beam => beam.id !== id),
      selectedEntity: state.selectedEntity?.id === id ? null : state.selectedEntity
    }));
  },
  
  // Start drawing a floor
  startDrawingFloor: (floor) => {
    set({ previewFloor: floor });
  },
  
  // Update preview floor while drawing
  setPreviewFloor: (floor) => {
    set({ previewFloor: floor });
  },
  
  // Finish drawing a floor
  endDrawingFloor: () => {
    const { previewFloor } = get();
    if (previewFloor) {
      // Add the floor system but don't clear the selection
      // Include the required properties for a FloorSystem
      get().addFloorSystem({
        ...previewFloor,
        joistDirection: 'x',
        joistDepth: 24,
        joistSpacing: 12,
        systemDepth: 24
      });
      // Just clear the preview but keep the selection and don't change mode
      set({ previewFloor: null });
    }
  },
  
  // Start drawing a beam
  startDrawingBeam: (beam) => {
    set({ previewBeam: beam });
  },
  
  // Update preview beam while drawing
  setPreviewBeam: (beam) => {
    set({ previewBeam: beam });
  },
  
  // Finish drawing a beam
  endDrawingBeam: () => {
    const { previewBeam } = get();
    if (previewBeam) {
      // Add the beam but include required properties
      get().addBeam({
        ...previewBeam,
        width: 6, // Default width in inches
        depth: 24  // Default depth in inches
      });
      // Just clear the preview but don't change mode
      set({ previewBeam: null });
    }
  },
  
  // Move the selected entity by delta
  moveSelectedEntity: (deltaX, deltaY) => {
    const GRID_SIZE = 12; // 12 inches
    const { selectedEntity } = get();
    
    if (!selectedEntity) return;
    
    // Move in 12-inch increments
    const moveX = deltaX * GRID_SIZE;
    const moveY = deltaY * GRID_SIZE;
    
    if (selectedEntity.type === EntityType.Floor) {
      const floor = selectedEntity as FloorSystem;
      const newX = Math.max(0, Math.min(480 - floor.width, floor.x + moveX));
      const newY = Math.max(0, Math.min(480 - floor.height, floor.y + moveY));
      
      // Check for overlap constraints
      const { floors, beams } = get();
      const otherFloors = floors.filter(f => f.id !== floor.id);
      
      // Create the new floor position
      const movedFloor = {
        ...floor,
        x: newX,
        y: newY
      };
      
      // Check for excessive overlap
      const hasExcessiveOverlap = otherFloors.some(existingFloor => {
        const overlapX = Math.max(0, Math.min(movedFloor.x + movedFloor.width, existingFloor.x + existingFloor.width) - Math.max(movedFloor.x, existingFloor.x));
        const overlapY = Math.max(0, Math.min(movedFloor.y + movedFloor.height, existingFloor.y + existingFloor.height) - Math.max(movedFloor.y, existingFloor.y));
        
        return overlapX > 12 && overlapY > 12;
      });
      
      if (hasExcessiveOverlap) {
        console.warn("Cannot move: Floor systems cannot overlap by more than 12 inches in any direction");
        return;
      }
      
      // Find beams connected to this floor
      const connectedBeams = beams.filter(beam => {
        // Check if beam starts or ends on this floor's perimeter
        const startsOnFloor = (
          (beam.startX === floor.x || beam.startX === floor.x + floor.width) ||
          (beam.startY === floor.y || beam.startY === floor.y + floor.height)
        );
        
        const endsOnFloor = (
          (beam.endX === floor.x || beam.endX === floor.x + floor.width) ||
          (beam.endY === floor.y || beam.endY === floor.y + floor.height)
        );
        
        return startsOnFloor || endsOnFloor;
      });
      
      // If there are connected beams, check if THIS SPECIFIC move will disconnect any beams from other floors
      if (connectedBeams.length > 0) {
        // For each beam connected to this floor, verify that the other end will still be on a floor perimeter
        const invalidMove = connectedBeams.some(beam => {
          // Determine if this beam starts or ends on the current floor
          const startsOnCurrentFloor = (
            (beam.startX === floor.x || beam.startX === floor.x + floor.width) &&
            (beam.startY >= floor.y && beam.startY <= floor.y + floor.height)
          ) || (
            (beam.startY === floor.y || beam.startY === floor.y + floor.height) &&
            (beam.startX >= floor.x && beam.startX <= floor.x + floor.width)
          );
          
          const endsOnCurrentFloor = (
            (beam.endX === floor.x || beam.endX === floor.x + floor.width) &&
            (beam.endY >= floor.y && beam.endY <= floor.y + floor.height)
          ) || (
            (beam.endY === floor.y || beam.endY === floor.y + floor.height) &&
            (beam.endX >= floor.x && beam.endX <= floor.x + floor.width)
          );
          
          // Skip beams that aren't actually connected to this floor's perimeter
          if (!startsOnCurrentFloor && !endsOnCurrentFloor) {
            return false;
          }
          
          // Calculate the new position of beam endpoints after floor move
          let newStartX = beam.startX, newStartY = beam.startY;
          let newEndX = beam.endX, newEndY = beam.endY;
          
          // Update the point that's on this floor
          if (startsOnCurrentFloor) {
            if (beam.startX === floor.x) newStartX = newX;
            else if (beam.startX === floor.x + floor.width) newStartX = newX + floor.width;
            
            if (beam.startY === floor.y) newStartY = newY;
            else if (beam.startY === floor.y + floor.height) newStartY = newY + floor.height;
          }
          
          if (endsOnCurrentFloor) {
            if (beam.endX === floor.x) newEndX = newX;
            else if (beam.endX === floor.x + floor.width) newEndX = newX + floor.width;
            
            if (beam.endY === floor.y) newEndY = newY;
            else if (beam.endY === floor.y + floor.height) newEndY = newY + floor.height;
          }
          
          // Check if other end point (the one not on current floor) will still be on a floor perimeter
          const otherPointConnected = floors.some(otherFloor => {
            if (otherFloor.id === floor.id) return false; // Skip the current floor
            
            // Check if the other end of the beam is on this floor's perimeter
            if (startsOnCurrentFloor && !endsOnCurrentFloor) {
              // End point needs to be checked - check if it's on any edge of the other floor
              const onLeftEdge = newEndX === otherFloor.x && newEndY >= otherFloor.y && newEndY <= otherFloor.y + otherFloor.height;
              const onRightEdge = newEndX === otherFloor.x + otherFloor.width && newEndY >= otherFloor.y && newEndY <= otherFloor.y + otherFloor.height;
              const onTopEdge = newEndY === otherFloor.y && newEndX >= otherFloor.x && newEndX <= otherFloor.x + otherFloor.width;
              const onBottomEdge = newEndY === otherFloor.y + otherFloor.height && newEndX >= otherFloor.x && newEndX <= otherFloor.x + otherFloor.width;
              
              return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
            } else if (endsOnCurrentFloor && !startsOnCurrentFloor) {
              // Start point needs to be checked - check if it's on any edge of the other floor
              const onLeftEdge = newStartX === otherFloor.x && newStartY >= otherFloor.y && newStartY <= otherFloor.y + otherFloor.height;
              const onRightEdge = newStartX === otherFloor.x + otherFloor.width && newStartY >= otherFloor.y && newStartY <= otherFloor.y + otherFloor.height;
              const onTopEdge = newStartY === otherFloor.y && newStartX >= otherFloor.x && newStartX <= otherFloor.x + otherFloor.width;
              const onBottomEdge = newStartY === otherFloor.y + otherFloor.height && newStartX >= otherFloor.x && newStartX <= otherFloor.x + otherFloor.width;
              
              return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
            }
            
            return false; // Both ends are on current floor, shouldn't happen
          });
          
          return !otherPointConnected;
        });
        
        if (invalidMove) {
          console.warn("Cannot move: This would disconnect beams from floor perimeters");
          return;
        }
      }
      
      // Update the floor position
      get().updateFloorSystem(floor.id, movedFloor);
      
      // Update connected beams
      beams.forEach(beam => {
        let needsUpdate = false;
        let newBeam = {...beam};
        
        // Check if beam starts on this floor's perimeter
        const isOnOldPerimeterStart = (
          (beam.startX === floor.x || beam.startX === floor.x + floor.width) ||
          (beam.startY === floor.y || beam.startY === floor.y + floor.height)
        );
        
        // Check if beam ends on this floor's perimeter
        const isOnOldPerimeterEnd = (
          (beam.endX === floor.x || beam.endX === floor.x + floor.width) ||
          (beam.endY === floor.y || beam.endY === floor.y + floor.height)
        );
        
        // Update beam start point if connected to this floor
        if (isOnOldPerimeterStart) {
          if (beam.startX === floor.x) {
            newBeam.startX = newX;
            needsUpdate = true;
          } else if (beam.startX === floor.x + floor.width) {
            newBeam.startX = newX + floor.width;
            needsUpdate = true;
          }
          
          if (beam.startY === floor.y) {
            newBeam.startY = newY;
            needsUpdate = true;
          } else if (beam.startY === floor.y + floor.height) {
            newBeam.startY = newY + floor.height;
            needsUpdate = true;
          }
        }
        
        // Update beam end point if connected to this floor
        if (isOnOldPerimeterEnd) {
          if (beam.endX === floor.x) {
            newBeam.endX = newX;
            needsUpdate = true;
          } else if (beam.endX === floor.x + floor.width) {
            newBeam.endX = newX + floor.width;
            needsUpdate = true;
          }
          
          if (beam.endY === floor.y) {
            newBeam.endY = newY;
            needsUpdate = true;
          } else if (beam.endY === floor.y + floor.height) {
            newBeam.endY = newY + floor.height;
            needsUpdate = true;
          }
        }
        
        // Update the beam if needed
        if (needsUpdate) {
          get().updateBeam(beam.id, newBeam);
        }
      });
    } else if (selectedEntity.type === EntityType.Beam) {
      // For beams, movement is more restricted as it must remain connected to floor perimeters
      const beam = selectedEntity as Beam;
      
      // Only move beams orthogonally (along its axis)
      let newStartX = beam.startX;
      let newStartY = beam.startY;
      let newEndX = beam.endX;
      let newEndY = beam.endY;
      
      // Determine if beam is horizontal or vertical
      const isHorizontalBeam = beam.startY === beam.endY;
      
      if (isHorizontalBeam && (deltaX === 0)) {
        // Move horizontal beam up/down
        newStartY = Math.max(0, Math.min(480, beam.startY + moveY));
        newEndY = Math.max(0, Math.min(480, beam.endY + moveY));
        
        // Check if new position is still on floor perimeters
        const { floors } = get();
        const startOnPerimeter = floors.some(floor => 
          (newStartX === floor.x || newStartX === floor.x + floor.width) && 
          (newStartY >= floor.y && newStartY <= floor.y + floor.height)
        );
        
        const endOnPerimeter = floors.some(floor => 
          (newEndX === floor.x || newEndX === floor.x + floor.width) && 
          (newEndY >= floor.y && newEndY <= floor.y + floor.height)
        );
        
        if (!startOnPerimeter || !endOnPerimeter) {
          console.warn("Cannot move: Beam must remain connected to floor perimeters");
          return;
        }
      } else if (!isHorizontalBeam && (deltaY === 0)) {
        // Move vertical beam left/right
        newStartX = Math.max(0, Math.min(480, beam.startX + moveX));
        newEndX = Math.max(0, Math.min(480, beam.endX + moveX));
        
        // Check if new position is still on floor perimeters
        const { floors } = get();
        const startOnPerimeter = floors.some(floor => 
          (newStartY === floor.y || newStartY === floor.y + floor.height) && 
          (newStartX >= floor.x && newStartX <= floor.x + floor.width)
        );
        
        const endOnPerimeter = floors.some(floor => 
          (newEndY === floor.y || newEndY === floor.y + floor.height) && 
          (newEndX >= floor.x && newEndX <= floor.x + floor.width)
        );
        
        if (!startOnPerimeter || !endOnPerimeter) {
          console.warn("Cannot move: Beam must remain connected to floor perimeters");
          return;
        }
      } else {
        // Can't move diagonally or against beam direction
        return;
      }
      
      // Update the beam position
      get().updateBeam(beam.id, {
        ...beam,
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY
      });
    }
  },
  
  // Delete the selected entity
  deleteSelectedEntity: () => {
    const { selectedEntity } = get();
    if (!selectedEntity) return;
    
    if (selectedEntity.type === EntityType.Floor) {
      get().deleteFloorSystem(selectedEntity.id);
    } else if (selectedEntity.type === EntityType.Beam) {
      get().deleteBeam(selectedEntity.id);
    }
  },
  
  // Clear all entities
  clearAllEntities: () => {
    set({
      floors: [],
      beams: [],
      selectedEntity: null
    });
  }
}));
