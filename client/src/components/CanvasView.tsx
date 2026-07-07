import { useRef, useEffect, useState } from "react";
import { useFloorModel } from "../lib/stores/useFloorModel";
import { Entity, FloorSystem, Beam, EntityType } from "../types";

const GRID_SIZE = 12; // 12 inches per grid
const CANVAS_WIDTH = 480; // 40 feet * 12 inches
const CANVAS_HEIGHT = 480; // 40 feet * 12 inches

const CanvasView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    mode,
    floors,
    beams,
    selectedEntity,
    setSelectedEntity,
    startDrawingFloor,
    endDrawingFloor,
    previewFloor,
    setPreviewFloor,
    startDrawingBeam,
    endDrawingBeam,
    previewBeam,
    setPreviewBeam,
  } = useFloorModel();

  // Grid drawing function
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  };

  // Draw all entities
  const drawEntities = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas first
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    drawGrid(ctx);
    
    // First draw all unselected floors
    floors.forEach((floor) => {
      const isSelected = selectedEntity?.id === floor.id;
      if (!isSelected) {
        ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        // Draw the main floor rectangle
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
        ctx.strokeRect(floor.x, floor.y, floor.width, floor.height);
      }
    });
    
    // Then draw the selected floor (if any) on top for better visibility
    const selectedFloor = floors.find(floor => floor.id === selectedEntity?.id);
    if (selectedFloor) {
      // Draw the selected floor with a more prominent style
      ctx.fillStyle = 'rgba(65, 105, 225, 0.6)'; // More vibrant blue
      ctx.strokeStyle = '#0055FF';
      ctx.lineWidth = 3;
      
      // Draw with a slight offset to make it stand out more
      const offset = 1; // 1px offset
      ctx.fillRect(
        selectedFloor.x - offset, 
        selectedFloor.y - offset, 
        selectedFloor.width + offset*2, 
        selectedFloor.height + offset*2
      );
      ctx.strokeRect(
        selectedFloor.x - offset, 
        selectedFloor.y - offset, 
        selectedFloor.width + offset*2, 
        selectedFloor.height + offset*2
      );
      
      // Draw a second high-contrast outline
      ctx.strokeStyle = '#FFFFFF'; // White outline
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        selectedFloor.x - 4, 
        selectedFloor.y - 4, 
        selectedFloor.width + 8, 
        selectedFloor.height + 8
      );
      
      // Draw outer blue outline
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        selectedFloor.x - 6, 
        selectedFloor.y - 6, 
        selectedFloor.width + 12, 
        selectedFloor.height + 12
      );
      ctx.setLineDash([]);
      
      // Draw highlighted corners
      const cornerSize = 10; // Slightly larger
      const corners = [
        { x: selectedFloor.x, y: selectedFloor.y }, // top-left
        { x: selectedFloor.x + selectedFloor.width, y: selectedFloor.y }, // top-right
        { x: selectedFloor.x, y: selectedFloor.y + selectedFloor.height }, // bottom-left
        { x: selectedFloor.x + selectedFloor.width, y: selectedFloor.y + selectedFloor.height } // bottom-right
      ];
      
      // Draw white background for corner markers
      ctx.fillStyle = '#FFFFFF';
      corners.forEach(corner => {
        ctx.fillRect(corner.x - cornerSize/2 - 1, corner.y - cornerSize/2 - 1, cornerSize + 2, cornerSize + 2);
      });
      
      // Draw blue corner markers
      ctx.fillStyle = '#0066FF';
      corners.forEach(corner => {
        ctx.fillRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
      });
    }
    
    
    // Draw beams
    beams.forEach((beam) => {
      const isSelected = selectedEntity?.id === beam.id;
      
      // Draw the main beam line
      ctx.strokeStyle = isSelected ? '#0066ff' : '#ff6600';
      ctx.lineWidth = isSelected ? 5 : 3;
      
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(beam.endX, beam.endY);
      ctx.stroke();
      
      // Draw endpoints for selected beams
      if (isSelected) {
        const endpointSize = 8;
        ctx.fillStyle = '#0066ff';
        
        // Start point
        ctx.beginPath();
        ctx.arc(beam.startX, beam.startY, endpointSize, 0, Math.PI * 2);
        ctx.fill();
        
        // End point
        ctx.beginPath();
        ctx.arc(beam.endX, beam.endY, endpointSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw preview floor
    if (previewFloor) {
      console.log('Drawing preview floor', previewFloor);
      ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;
      ctx.fillRect(previewFloor.x, previewFloor.y, previewFloor.width, previewFloor.height);
      ctx.strokeRect(previewFloor.x, previewFloor.y, previewFloor.width, previewFloor.height);
    }
    
    // Draw preview beam
    if (previewBeam) {
      console.log('Drawing preview beam', previewBeam);
      
      // Draw main line with animated dashed effect
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      // Animate the dash pattern
      const dashOffset = (Date.now() / 100) % 10;
      ctx.lineDashOffset = -dashOffset;
      
      ctx.beginPath();
      ctx.moveTo(previewBeam.startX, previewBeam.startY);
      ctx.lineTo(previewBeam.endX, previewBeam.endY);
      ctx.stroke();
      
      // Reset dash pattern
      ctx.setLineDash([]);
      
      // Draw endpoint markers
      const endpointSize = 6;
      ctx.fillStyle = '#ff6600';
      
      // Start point
      ctx.beginPath();
      ctx.arc(previewBeam.startX, previewBeam.startY, endpointSize, 0, Math.PI * 2);
      ctx.fill();
      
      // End point
      ctx.beginPath();
      ctx.arc(previewBeam.endX, previewBeam.endY, endpointSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Distance label
      const dx = previewBeam.endX - previewBeam.startX;
      const dy = previewBeam.endY - previewBeam.startY;
      const distance = Math.sqrt(dx * dx + dy * dy) / GRID_SIZE; // Convert to feet
      
      // Position the label at the midpoint of the beam
      const midX = (previewBeam.startX + previewBeam.endX) / 2;
      const midY = (previewBeam.startY + previewBeam.endY) / 2;
      
      // Draw label with background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(midX - 30, midY - 15, 60, 20);
      
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(`${distance.toFixed(1)} ft`, midX, midY);
    }
    
    // Draw selection info in the top-left corner
    if (selectedEntity) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 300, 50);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`Selected: ${selectedEntity.type.toUpperCase()} (ID: ${selectedEntity.id.substring(0, 8)}...)`, 20, 30);
      
      // Add more specific info
      if (selectedEntity.type === EntityType.Floor) {
        const floor = selectedEntity as FloorSystem;
        ctx.fillText(`Position: (${floor.x}, ${floor.y}), Size: ${floor.width} x ${floor.height}`, 20, 50);
      } else if (selectedEntity.type === EntityType.Beam) {
        const beam = selectedEntity as Beam;
        ctx.fillText(`From (${beam.startX}, ${beam.startY}) to (${beam.endX}, ${beam.endY})`, 20, 50);
      }
    }
  };

  // Snap to grid helper
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Helper to find if a point is on floor perimeter
  const isOnFloorPerimeter = (x: number, y: number, floor: FloorSystem): boolean => {
    const edgeThreshold = 6; // Half grid size for easier snapping
    
    const onLeftEdge = Math.abs(x - floor.x) < edgeThreshold && 
                       y >= floor.y - edgeThreshold && 
                       y <= floor.y + floor.height + edgeThreshold;
                       
    const onRightEdge = Math.abs(x - (floor.x + floor.width)) < edgeThreshold && 
                        y >= floor.y - edgeThreshold && 
                        y <= floor.y + floor.height + edgeThreshold;
                        
    const onTopEdge = Math.abs(y - floor.y) < edgeThreshold && 
                      x >= floor.x - edgeThreshold && 
                      x <= floor.x + floor.width + edgeThreshold;
                      
    const onBottomEdge = Math.abs(y - (floor.y + floor.height)) < edgeThreshold && 
                         x >= floor.x - edgeThreshold && 
                         x <= floor.x + floor.width + edgeThreshold;
    
    return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
  };

  // Get nearest perimeter point of a floor at position
  const getNearestPerimeterPoint = (x: number, y: number, floor: FloorSystem): { x: number, y: number } => {
    const snapX = snapToGrid(x);
    const snapY = snapToGrid(y);
    
    // Find the closest edge
    const distToLeft = Math.abs(snapX - floor.x);
    const distToRight = Math.abs(snapX - (floor.x + floor.width));
    const distToTop = Math.abs(snapY - floor.y);
    const distToBottom = Math.abs(snapY - (floor.y + floor.height));
    
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    
    if (minDist === distToLeft) {
      return { x: floor.x, y: snapY };
    } else if (minDist === distToRight) {
      return { x: floor.x + floor.width, y: snapY };
    } else if (minDist === distToTop) {
      return { x: snapX, y: floor.y };
    } else {
      return { x: snapX, y: floor.y + floor.height };
    }
  };

  // We no longer need the complex entity selection logic since we're handling
  // selection directly in the mouse down handler

  // Helper to calculate distance from point to line segment
  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // We removed the getFloorAtPosition function since we now handle floor selection directly

  // Initialize canvas on first render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initial render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawEntities(ctx);
  }, []);

  // Effect to redraw canvas when previewFloor changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    console.log('Redrawing canvas on preview change', { previewFloor });
    // Redraw canvas
    drawEntities(ctx);
  }, [previewFloor, previewBeam, floors, beams, selectedEntity]);
  
  // React-based mouse interactions for direct DOM access
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // For beam creation
  const [beamStartPoint, setBeamStartPoint] = useState<{x: number, y: number, floor: FloorSystem} | null>(null);

  // We no longer need to track mouseDownOnEntity since we handle selection directly
  
  // Instead of using DOM event listeners, let's add a React component that 
  // will wrap the Inspector and handle clicks for us
  
  // Create a simple parent class for App.tsx to wrap Inspector with
  useEffect(() => {
    // Update the inspector container to handle clicks
    const addInspectorClickHandler = () => {
      const inspectorContainer = document.querySelector('.inspector-container');
      if (inspectorContainer) {
        // Add a data attribute we can check in our click handlers
        inspectorContainer.setAttribute('data-inspector', 'true');
      }
    };
    
    // Run immediately after render
    addInspectorClickHandler();
    
    // Also run whenever selected entity changes since the Inspector may re-render
    const timerId = setTimeout(addInspectorClickHandler, 100);
    
    return () => clearTimeout(timerId);
  }, [selectedEntity]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Check if the event target's path includes the inspector container
    // This ensures we don't handle canvas clicks when the user is interacting with the inspector
    const inspectorContainer = document.querySelector('.inspector-container');
    if (inspectorContainer) {
      // Check if the click was inside the inspector
      const target = e.target as Node;
      if (inspectorContainer.contains(target)) {
        // Clicked on inspector, don't do anything with the canvas
        return;
      }
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snapX = snapToGrid(x);
    const snapY = snapToGrid(y);
    
    console.log('React MouseDown', { mode, x, y, snapX, snapY });
    
    // With our new overlay approach, we don't need to handle selection in the canvas event
    // The overlay divs will handle selection clicks directly
    
    // Only handle floor drawing and beam drawing in the canvas events
    if (mode === 'floor') {
      setIsDrawing(true);
      setStartPos({ x: snapX, y: snapY });
      
      // Create initial floor with zero dimensions
      const initialFloor = { 
        x: snapX, 
        y: snapY, 
        width: 0, 
        height: 0 
      };
      console.log('Starting floor at', initialFloor);
      setPreviewFloor(initialFloor);
    } else if (mode === 'beam') {
      // Find if we're clicking on a floor perimeter for beam creation
      for (const floor of floors) {
        if (isOnFloorPerimeter(x, y, floor)) {
          const perimeterPoint = getNearestPerimeterPoint(x, y, floor);
          console.log('Starting beam at floor perimeter', { perimeterPoint, floor });
          setBeamStartPoint({
            x: perimeterPoint.x,
            y: perimeterPoint.y,
            floor
          });
          setPreviewBeam({
            startX: perimeterPoint.x,
            startY: perimeterPoint.y,
            endX: perimeterPoint.x,
            endY: perimeterPoint.y
          });
          setIsDrawing(true);
          break;
        }
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snapX = snapToGrid(x);
    const snapY = snapToGrid(y);
    
    if (mode === 'floor') {
      // Update preview floor dimensions
      const newPreview = {
        x: Math.min(startPos.x, snapX),
        y: Math.min(startPos.y, snapY),
        width: Math.abs(snapX - startPos.x),
        height: Math.abs(snapY - startPos.y)
      };
      
      console.log('Mouse move in floor drawing, updating preview', newPreview);
      setPreviewFloor(newPreview);
    } else if (mode === 'beam' && beamStartPoint) {
      // For beams, we need to determine the orthogonal direction
      const isHorizontalBeam = Math.abs(snapY - beamStartPoint.y) < Math.abs(snapX - beamStartPoint.x);
      
      if (isHorizontalBeam) {
        // Horizontal beam - same Y coordinate
        setPreviewBeam({
          startX: beamStartPoint.x,
          startY: beamStartPoint.y,
          endX: snapX,
          endY: beamStartPoint.y
        });
      } else {
        // Vertical beam - same X coordinate
        setPreviewBeam({
          startX: beamStartPoint.x,
          startY: beamStartPoint.y,
          endX: beamStartPoint.x,
          endY: snapY
        });
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Selection is now entirely handled in the mouseDown event
    // This simplifies our approach and makes selection more reliable
    if (mode === 'select') {
      return;
    }
    
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (mode === 'floor') {  
      console.log('Mouse up, floor drawing complete', { previewFloor });
      
      // Only add the floor if it has valid dimensions
      if (previewFloor && previewFloor.width >= GRID_SIZE && previewFloor.height >= GRID_SIZE) {
        console.log('Adding floor with dimensions', previewFloor);
        
        // Use the prop function to add the floor system
        const { addFloorSystem } = useFloorModel.getState(); 
        addFloorSystem({
          x: previewFloor.x,
          y: previewFloor.y,
          width: previewFloor.width,
          height: previewFloor.height,
          joistDirection: 'x',
          joistDepth: 24,
          joistSpacing: 12,
          systemDepth: 24
        });
        
        // Reset the preview and set mode back to select
        setPreviewFloor(null);
        const { setMode } = useFloorModel.getState();
        setMode('select');
      } else {
        console.log('Floor too small, canceling');
        setPreviewFloor(null);
      }
    } else if (mode === 'beam' && beamStartPoint && previewBeam) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if we're ending on a floor perimeter
      for (const floor of floors) {
        if (isOnFloorPerimeter(x, y, floor)) {
          const perimeterPoint = getNearestPerimeterPoint(x, y, floor);
          
          // Make sure we're drawing orthogonally (horizontal or vertical)
          let endX = perimeterPoint.x;
          let endY = perimeterPoint.y;
          
          const isHorizontalBeam = Math.abs(endY - beamStartPoint.y) < Math.abs(endX - beamStartPoint.x);
          
          if (isHorizontalBeam) {
            endY = beamStartPoint.y; // Keep Y coordinate the same
          } else {
            endX = beamStartPoint.x; // Keep X coordinate the same
          }
          
          // Check if the beam has a reasonable length
          const beamLength = Math.sqrt(
            Math.pow(endX - beamStartPoint.x, 2) + 
            Math.pow(endY - beamStartPoint.y, 2)
          );
          
          if (beamLength >= GRID_SIZE) {
            // Add the beam
            console.log('Adding beam', { 
              startX: beamStartPoint.x, 
              startY: beamStartPoint.y, 
              endX, 
              endY 
            });
            
            const { addBeam, setMode } = useFloorModel.getState();
            addBeam({
              startX: beamStartPoint.x,
              startY: beamStartPoint.y,
              endX,
              endY,
              width: 6,
              depth: 24
            });
            
            // Reset and go back to select mode
            setPreviewBeam(null);
            setBeamStartPoint(null);
            setMode('select');
          } else {
            console.log('Beam too short, canceling');
            setPreviewBeam(null);
            setBeamStartPoint(null);
          }
          break;
        }
      }
      
      if (previewBeam) {
        // If we didn't break out by creating a beam, reset the preview
        setPreviewBeam(null);
        setBeamStartPoint(null);
      }
    }
  };

  // Create clickable div overlays for each floor
  // This provides a much more reliable way to select entities using the DOM instead of canvas hit detection
  const renderFloorOverlays = () => {
    // Sort floors by area (descending) so smaller floors render on top
    // This ensures users can click on smaller floors that overlap with larger ones
    const sortedFloors = [...floors].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaB - areaA; // Larger floors first (at the bottom)
    });
    
    return sortedFloors.map(floor => {
      const isSelected = selectedEntity?.id === floor.id;
      
      return (
        <div
          key={floor.id}
          className="absolute cursor-pointer floor-hitbox"
          style={{
            left: `${floor.x}px`,
            top: `${floor.y}px`,
            width: `${floor.width}px`,
            height: `${floor.height}px`,
            // Give a clear visual hover effect for debugging, almost invisible normally
            backgroundColor: 'rgba(0, 0, 255, 0.03)',
            // Make selected floors easier to see for debugging but still clickable
            border: isSelected ? '1px dashed rgba(0, 100, 255, 0.3)' : '1px solid transparent',
            // Add a subtle hover effect
            transition: 'background-color 0.1s ease',
            // Higher z-index for smaller floors
            zIndex: 10
          }}
          onMouseOver={(e) => {
            // Add a hover effect
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 255, 0.08)';
          }}
          onMouseOut={(e) => {
            // Remove hover effect
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 255, 0.03)';
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent bubbling to the canvas
            if (mode === 'select') {
              console.log('Floor overlay clicked:', floor.id);
              setSelectedEntity(floor);
            }
          }}
        />
      );
    });
  };
  
  // Create clickable overlays for beams
  const renderBeamOverlays = () => {
    return beams.map(beam => {
      // Calculate the angle and dimensions for the beam overlay
      const dx = beam.endX - beam.startX;
      const dy = beam.endY - beam.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      const isSelected = selectedEntity?.id === beam.id;
      // Create a larger hit area for easier clicking - beams can be hard to select
      const hitPadding = 8; // 8px padding around the beam for easier selection
      
      return (
        <div
          key={beam.id}
          className="absolute cursor-pointer beam-hitbox"
          style={{
            left: `${beam.startX - hitPadding/2}px`,
            top: `${beam.startY - beam.width/2 - hitPadding/2}px`,
            width: `${length + hitPadding}px`,
            height: `${beam.width + hitPadding}px`,
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg)`,
            // Make the overlay almost invisible but give a slight hint
            backgroundColor: 'rgba(255, 0, 0, 0.03)',
            border: isSelected ? '1px dashed rgba(255, 100, 0, 0.3)' : '1px solid transparent',
            transition: 'background-color 0.1s ease',
            // Beams should be on top of floors for selection
            zIndex: 15
          }}
          onMouseOver={(e) => {
            // Add a hover effect
            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.08)';
          }}
          onMouseOut={(e) => {
            // Remove hover effect
            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.03)';
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent bubbling to the canvas
            if (mode === 'select') {
              console.log('Beam overlay clicked:', beam.id);
              setSelectedEntity(beam);
            }
          }}
        />
      );
    });
  };

  // This is the handler for clicking on the canvas background (for empty space selection)
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'select') {
      // Only handle background clicks in select mode
      console.log('Canvas background clicked, clearing selection');
      setSelectedEntity(null);
    }
  };
  
  // Render a helper message when in beam mode
  const renderBeamModeHelper = () => {
    if (mode !== 'beam') return null;
    
    return (
      <div 
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
        style={{ zIndex: 100 }}
      >
        Click on the edge of a floor to start drawing a beam
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-auto">
      <div 
        className="relative" 
        style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        onClick={handleBackgroundClick}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-300 absolute top-0 left-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        
        {/* Only render overlays in select mode, otherwise they block beam creation */}
        {mode === 'select' && (
          <>
            {renderFloorOverlays()}
            {renderBeamOverlays()}
          </>
        )}
        
        {/* Show helper message in beam mode */}
        {renderBeamModeHelper()}
        
        {/* Visual indicator when in beam drawing mode */}
        {mode === 'beam' && isDrawing && beamStartPoint && (
          <>
            <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-500 pointer-events-none" />
            <div 
              className="absolute pointer-events-none bg-blue-600 text-white px-2 py-1 rounded-md"
              style={{ 
                top: beamStartPoint.y + 10, 
                left: beamStartPoint.x + 10,
                zIndex: 100
              }}
            >
              Click on another floor edge to complete the beam
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasView;
