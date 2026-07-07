import { useEffect } from "react";
import CanvasView from "./components/CanvasView";
import ThreeView from "./components/ThreeView";
import Inspector from "./components/Inspector";
import { useFloorModel } from "./lib/stores/useFloorModel";
import { Button } from "./components/ui/button";

function App() {
  const { 
    mode, 
    setMode, 
    selectedEntity, 
    clearAllEntities,
    deleteSelectedEntity
  } = useFloorModel();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the current state at the time of keypress
      const currentState = useFloorModel.getState();
      const currentSelectedEntity = currentState.selectedEntity;
      
      if (!currentSelectedEntity) return;
      
      if (e.key === "Delete") {
        currentState.deleteSelectedEntity();
        e.preventDefault();
        return;
      }
      
      // Store the entity ID to find it after movement
      const entityId = currentSelectedEntity.id;
      const entityType = currentSelectedEntity.type;
      
      // Handle arrow key movement
      switch (e.key) {
        case "ArrowUp":
          currentState.moveSelectedEntity(0, -1);
          e.preventDefault();
          break;
        case "ArrowDown":
          currentState.moveSelectedEntity(0, 1);
          e.preventDefault();
          break;
        case "ArrowLeft":
          currentState.moveSelectedEntity(-1, 0);
          e.preventDefault();
          break;
        case "ArrowRight":
          currentState.moveSelectedEntity(1, 0);
          e.preventDefault();
          break;
      }
      
      // Restore selection by finding the entity with the same ID
      setTimeout(() => {
        const newState = useFloorModel.getState();
        if (entityType === 'floor') {
          const updatedFloor = newState.floors.find(f => f.id === entityId);
          if (updatedFloor) {
            newState.setSelectedEntity(updatedFloor);
          }
        } else if (entityType === 'beam') {
          const updatedBeam = newState.beams.find(b => b.id === entityId);
          if (updatedBeam) {
            newState.setSelectedEntity(updatedBeam);
          }
        }
      }, 0);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Remove dependencies to prevent recreation

  return (
    <div className="flex flex-col h-screen">
      <div className="flex p-4 bg-gray-100 gap-2">
        <Button 
          onClick={() => setMode("floor")}
          variant={mode === "floor" ? "default" : "outline"}
        >
          Add Floor
        </Button>
        <Button
          onClick={() => {
            console.log("Setting mode to beam");
            setMode("beam");
          }}
          variant={mode === "beam" ? "default" : "outline"}
        >
          Add Beam
        </Button>
        <Button
          onClick={() => setMode("select")}
          variant={mode === "select" ? "default" : "outline"}
        >
          Select
        </Button>
        <Button
          onClick={clearAllEntities}
          variant="destructive"
          className="ml-auto"
        >
          Clear All
        </Button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 h-full border-r border-gray-300">
          <CanvasView />
        </div>
        <div className="w-1/2 h-full relative">
          <ThreeView />
        </div>
      </div>
      
      {selectedEntity && (
        <div className="absolute top-20 right-8 w-72 inspector-container" onClick={(e) => e.stopPropagation()}>
          <Inspector />
        </div>
      )}
    </div>
  );
}

export default App;
