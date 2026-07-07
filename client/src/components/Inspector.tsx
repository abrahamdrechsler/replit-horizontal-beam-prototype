import { useState, useEffect } from "react";
import { useFloorModel } from "../lib/stores/useFloorModel";
import { EntityType, FloorSystem, Beam } from "../types";
import { Form } from "./ui/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";

const Inspector = () => {
  const { selectedEntity, updateFloorSystem, updateBeam } = useFloorModel();
  
  const [floorValues, setFloorValues] = useState({
    joistDirection: 'x',
    joistDepth: 24,
    joistSpacing: 12,
    systemDepth: 24
  });
  
  const [beamValues, setBeamValues] = useState({
    width: 6,
    depth: 24
  });
  
  // Update form values when selected entity changes
  useEffect(() => {
    if (!selectedEntity) return;
    
    if (selectedEntity.type === EntityType.Floor) {
      // Cast to the correct type
      const floorSystem = selectedEntity as FloorSystem;
      setFloorValues({
        joistDirection: floorSystem.joistDirection,
        joistDepth: floorSystem.joistDepth,
        joistSpacing: floorSystem.joistSpacing,
        systemDepth: floorSystem.systemDepth
      });
    } else if (selectedEntity.type === EntityType.Beam) {
      // Cast to the correct type
      const beam = selectedEntity as Beam;
      setBeamValues({
        width: beam.width,
        depth: beam.depth
      });
    }
  }, [selectedEntity]);
  
  // Update floor values handler
  const handleFloorValueChange = (field: string, value: any) => {
    // For numeric fields, convert to number
    let processedValue = value;
    
    if (field !== 'joistDirection') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) return; // Invalid number input
      processedValue = numValue;
    }
    
    console.log('Updating floor value:', { field, value, processedValue });
    
    // Update local state
    setFloorValues(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // Only update the store if we have a selected entity
    if (selectedEntity && selectedEntity.type === EntityType.Floor) {
      // Cast to the correct type 
      const floorSystem = selectedEntity as FloorSystem;
      
      // Create an updated floor system with the new value
      const updatedFloor = {
        ...floorSystem,
        [field]: processedValue
      } as FloorSystem;
      
      // Update the floor system
      updateFloorSystem(floorSystem.id, updatedFloor);
    }
  };
  
  // Update beam values handler
  const handleBeamValueChange = (field: string, value: any) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    setBeamValues(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    if (selectedEntity && selectedEntity.type === EntityType.Beam) {
      // Cast to the correct type
      const beam = selectedEntity as Beam;
      
      // Create an updated beam with the new value
      const updatedBeam = {
        ...beam,
        [field]: numValue
      } as Beam;
      
      // Update the beam
      updateBeam(beam.id, updatedBeam);
    }
  };
  
  // Render inspector for floor system
  const renderFloorInspector = () => {
    return (
      <Form className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="joistDirection">Joist Direction</Label>
          <select
            id="joistDirection"
            value={floorValues.joistDirection}
            onChange={(e) => handleFloorValueChange('joistDirection', e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3"
          >
            <option value="x">X</option>
            <option value="y">Y</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="joistDepth">Joist Depth (inches)</Label>
          <Input
            id="joistDepth"
            type="number"
            value={floorValues.joistDepth}
            onChange={(e) => handleFloorValueChange('joistDepth', e.target.value)}
            min="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="joistSpacing">Joist Spacing (inches)</Label>
          <Input
            id="joistSpacing"
            type="number"
            value={floorValues.joistSpacing}
            onChange={(e) => handleFloorValueChange('joistSpacing', e.target.value)}
            min="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="systemDepth">System Depth (inches)</Label>
          <Input
            id="systemDepth"
            type="number"
            value={floorValues.systemDepth}
            onChange={(e) => handleFloorValueChange('systemDepth', e.target.value)}
            min="1"
          />
        </div>
      </Form>
    );
  };
  
  // Render inspector for beam
  const renderBeamInspector = () => {
    return (
      <Form className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="width">Width (inches)</Label>
          <Input
            id="width"
            type="number"
            value={beamValues.width}
            onChange={(e) => handleBeamValueChange('width', e.target.value)}
            min="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="depth">Depth (inches)</Label>
          <Input
            id="depth"
            type="number"
            value={beamValues.depth}
            onChange={(e) => handleBeamValueChange('depth', e.target.value)}
            min="1"
          />
        </div>
      </Form>
    );
  };
  
  if (!selectedEntity) return null;
  
  return (
    <div className="bg-white shadow-lg rounded-lg">
      <div className="py-2 px-4 bg-gray-100 rounded-t-lg font-medium">
        {selectedEntity.type === EntityType.Floor ? 'Floor System Properties' : 'Beam Properties'}
      </div>
      {selectedEntity.type === EntityType.Floor ? renderFloorInspector() : renderBeamInspector()}
    </div>
  );
};

export default Inspector;
