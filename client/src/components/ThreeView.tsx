import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFloorModel } from "../lib/stores/useFloorModel";
import { FloorSystem, Beam } from "../types";

// Component for rendering a single floor system in 3D
const Floor3D = ({ floor }: { floor: FloorSystem }) => {
  const { selectedEntity } = useFloorModel();
  const isSelected = selectedEntity?.id === floor.id;
  
  // Calculate joist positions
  const joists = [];
  
  if (floor.joistSpacing > 0 && floor.joistSpacing < floor.width / 2) {
    const span = floor.joistDirection === 'x' ? floor.width : floor.height;
    const count = Math.floor(span / floor.joistSpacing);
    
    for (let i = 1; i < count; i++) {
      const position = i * floor.joistSpacing;
      joists.push(position);
    }
  }

  return (
    <group position={[
      floor.x + floor.width / 2 - CANVAS_WIDTH / 2, 
      0, 
      floor.y + floor.height / 2 - CANVAS_HEIGHT / 2
    ]}>
      {/* Main floor system */}
      <mesh position={[0, floor.systemDepth / 2, 0]}>
        <boxGeometry args={[floor.width, floor.systemDepth, floor.height]} />
        <meshStandardMaterial 
          color={0xadd8e6} 
          transparent={true} 
          opacity={0.7} 
        />
      </mesh>
      
      {/* Outline for selected floor */}
      {isSelected && (
        <lineSegments position={[0, floor.systemDepth / 2, 0]}>
          <edgesGeometry attach="geometry">
            <boxGeometry args={[floor.width, floor.systemDepth, floor.height]} />
          </edgesGeometry>
          <lineBasicMaterial color={0x0066ff} linewidth={2} />
        </lineSegments>
      )}
      
      {/* Joists */}
      {joists.map((pos, index) => (
        <mesh 
          key={index} 
          position={[
            floor.joistDirection === 'x' ? pos - floor.width / 2 : 0, 
            floor.systemDepth / 2 + (floor.joistDepth - floor.systemDepth) / 2, 
            floor.joistDirection === 'y' ? pos - floor.height / 2 : 0
          ]}
        >
          <boxGeometry 
            args={[
              floor.joistDirection === 'x' ? 2 : floor.width, 
              floor.joistDepth, 
              floor.joistDirection === 'y' ? 2 : floor.height
            ]} 
          />
          <meshStandardMaterial color={0x996633} />
        </mesh>
      ))}
    </group>
  );
};

// Component for rendering a single beam in 3D
const Beam3D = ({ beam }: { beam: Beam }) => {
  const { selectedEntity } = useFloorModel();
  const isSelected = selectedEntity?.id === beam.id;
  
  // Calculate beam dimensions and position
  const length = Math.sqrt(
    Math.pow(beam.endX - beam.startX, 2) + 
    Math.pow(beam.endY - beam.startY, 2)
  );
  
  const center = {
    x: (beam.startX + beam.endX) / 2,
    y: (beam.startY + beam.endY) / 2
  };
  
  // Calculate rotation angle
  const angle = Math.atan2(beam.endY - beam.startY, beam.endX - beam.startX);
  
  // Create refs for animation
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  
  // Animate selected beams
  useFrame((state) => {
    if (isSelected && groupRef.current && beamRef.current) {
      // Subtle hover animation for selected beams
      beamRef.current.position.y = beam.depth / 2 + Math.sin(state.clock.elapsedTime * 2) * 2;
      
      // Pulsing color for selected beams
      const material = beamRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        // Pulse between orange and a slightly brighter orange
        material.color.setRGB(
          1.0, // Red
          0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.1, // Green
          0.0 + Math.sin(state.clock.elapsedTime * 3) * 0.1  // Blue
        );
      }
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[
        center.x - CANVAS_WIDTH / 2, 
        0, 
        center.y - CANVAS_HEIGHT / 2
      ]} 
      rotation={[0, -angle, 0]}
    >
      <mesh 
        ref={beamRef}
        position={[0, beam.depth / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[length, beam.depth, beam.width]} />
        <meshStandardMaterial 
          color={isSelected ? 0xff7722 : 0xff6600} 
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      
      {/* Outline for selected beam */}
      {isSelected && (
        <>
          <lineSegments position={[0, beam.depth / 2, 0]}>
            <edgesGeometry attach="geometry">
              <boxGeometry args={[length, beam.depth, beam.width]} />
            </edgesGeometry>
            <lineBasicMaterial color={0x0066ff} linewidth={2} />
          </lineSegments>
          
          {/* End cap markers */}
          <mesh position={[length/2, beam.depth/2, 0]} scale={[0.1, 1, 1]}>
            <boxGeometry args={[beam.width * 1.2, beam.depth, beam.width * 1.2]} />
            <meshStandardMaterial color={0xff3300} />
          </mesh>
          
          <mesh position={[-length/2, beam.depth/2, 0]} scale={[0.1, 1, 1]}>
            <boxGeometry args={[beam.width * 1.2, beam.depth, beam.width * 1.2]} />
            <meshStandardMaterial color={0xff3300} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Grid component for reference
const Grid = () => {
  return (
    <gridHelper 
      args={[CANVAS_WIDTH, CANVAS_WIDTH / GRID_SIZE, 0x888888, 0x444444]} 
      position={[0, 0, 0]}
      // Grid should be horizontal with Z going up
    />
  );
};

// 3D scene setup
const Scene = () => {
  const { floors, beams, setSelectedEntity } = useFloorModel();
  const { camera, scene, gl } = useThree();
  
  // Set up raycaster for selection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  // Set up shadows
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  
  // Initial camera setup
  useEffect(() => {
    // Position the camera at an isometric view looking down at the floor systems
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // Handle click events for selection
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // Traverse up to find the group (our entity)
        let parent = intersects[0].object;
        while (parent.parent && parent.parent !== scene) {
          parent = parent.parent;
        }
        
        // Find the entity ID from the object's userData
        const entityId = parent.userData.entityId;
        if (entityId) {
          // Find the entity in our store
          const floorEntity = floors.find(f => f.id === entityId);
          if (floorEntity) {
            setSelectedEntity(floorEntity);
            return;
          }
          
          const beamEntity = beams.find(b => b.id === entityId);
          if (beamEntity) {
            setSelectedEntity(beamEntity);
            return;
          }
        }
      }
      
      // If no entity was clicked, deselect
      setSelectedEntity(null);
    };
    
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [camera, floors, beams, scene, setSelectedEntity]);
  
  // Set entity IDs in userData for selection
  useFrame(() => {
    scene.traverse((object) => {
      if (object.type === "Group") {
        // Find the corresponding entity
        const floor = floors.find(f => 
          object.position.x === f.x + f.width / 2 - CANVAS_WIDTH / 2 &&
          object.position.z === f.y + f.height / 2 - CANVAS_HEIGHT / 2
        );
        
        if (floor) {
          object.userData.entityId = floor.id;
        } else {
          const beam = beams.find(b => {
            const center = {
              x: (b.startX + b.endX) / 2,
              y: (b.startY + b.endY) / 2
            };
            return object.position.x === center.x - CANVAS_WIDTH / 2 &&
                   object.position.z === center.y - CANVAS_HEIGHT / 2;
          });
          
          if (beam) {
            object.userData.entityId = beam.id;
          }
        }
      }
    });
  });

  return (
    <>
      {/* Better lighting setup for architectural visualization */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light (sun-like) with shadows */}
      <directionalLight 
        position={[100, 100, 100]} 
        intensity={0.6} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
      >
        <orthographicCamera 
          attach="shadow-camera" 
          args={[-100, 100, 100, -100, 0.1, 500]} 
        />
      </directionalLight>
      
      {/* Fill light from the opposite side */}
      <directionalLight 
        position={[-50, 50, -50]} 
        intensity={0.3} 
      />
      
      {/* Subtle blue-ish top light for architectural feel */}
      <directionalLight 
        position={[0, 100, 0]} 
        intensity={0.2} 
        color="#8888ff" 
      />
      
      <Grid />
      
      {/* Ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        receiveShadow
      >
        <planeGeometry args={[CANVAS_WIDTH * 2, CANVAS_HEIGHT * 2]} />
        <meshStandardMaterial 
          color="#e0e0e0" 
          roughness={0.9}
          metalness={0.1} 
        />
      </mesh>
      
      {/* Render floors and beams */}
      {floors.map(floor => (
        <Floor3D key={floor.id} floor={floor} />
      ))}
      {beams.map(beam => (
        <Beam3D key={beam.id} beam={beam} />
      ))}
    </>
  );
};

// Constants from CanvasView
const GRID_SIZE = 12;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;

const ThreeView = () => {
  return (
    <Canvas 
      style={{ width: "100%", height: "100%" }}
      shadows
      gl={{ 
        antialias: true,
        alpha: false
      }}
      camera={{ position: [200, 200, 200], fov: 45 }}
    >
      <Scene />
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={50}
        maxDistance={500}
      />
    </Canvas>
  );
};

export default ThreeView;
