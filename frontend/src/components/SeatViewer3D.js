import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// ── Single Seat Cube ───────────────────────────────────────────────────────────
function Seat({ position, seat, isSelected, onClick }) {
  const meshRef = useRef();
  const backRef = useRef();
  const [hovered, setHovered] = useState(false);

  const isBooked = seat.status === "BOOKED";

  useFrame(() => {
    if (!meshRef.current) return;
    const targetY = hovered && !isBooked ? 0.18 : 0;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      position[1] + targetY,
      0.12
    );
    if (backRef.current) {
      backRef.current.position.y = THREE.MathUtils.lerp(
        backRef.current.position.y,
        position[1] + targetY + 0.35,
        0.12
      );
    }
    const scale = isSelected ? 1.18 : hovered && !isBooked ? 1.08 : 1;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.12)
    );
  });

  const color = isBooked
    ? "#ef4444"
    : isSelected
    ? "#f59e0b"
    : hovered
    ? "#818cf8"
    : "#22c55e";

  const emissive = isBooked
    ? "#7f1d1d"
    : isSelected
    ? "#92400e"
    : hovered
    ? "#312e81"
    : "#14532d";

  return (
    <group>
      {/* Seat base */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={() => !isBooked && onClick(seat)}
        onPointerOver={() => {
          if (!isBooked) setHovered(true);
          document.body.style.cursor = isBooked ? "not-allowed" : "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.75, 0.35, 0.75]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected ? 0.7 : 0.4}
          roughness={0.3}
          metalness={0.15}
        />
      </mesh>

      {/* Seat back */}
      <mesh
        ref={backRef}
        position={[position[0], position[1] + 0.35, position[2] - 0.27]}
      >
        <boxGeometry args={[0.75, 0.6, 0.08]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected ? 0.6 : 0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Seat label */}
      <Text
        position={[position[0], position[1] + 0.54, position[2] + 0.22]}
        rotation={[-Math.PI / 2.4, 0, 0]}
        fontSize={0.17}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#000"
      >
        {seat.seat_number}
      </Text>

      {/* Selected glow ring */}
      {isSelected && (
        <mesh position={[position[0], position[1] - 0.05, position[2]]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// ── Stage ──────────────────────────────────────────────────────────────────────
function Stage() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, -6]}
        receiveShadow
      >
        <planeGeometry args={[14, 4]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
      </mesh>
      {/* Stage edge glow strip */}
      <mesh position={[0, 0.02, -4.1]}>
        <boxGeometry args={[14, 0.06, 0.1]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// ── Main 3D Scene ──────────────────────────────────────────────────────────────
export default function SeatViewer3D({ seats, selectedSeats = [], onSeatClick }) {
  const COLS = 10;
  const GAP_X = 1.1;
  const GAP_Z = 1.3;
  const selectedIds = new Set(selectedSeats.map((s) => s.id));

  return (
    <div
      style={{
        width: "100%",
        height: "480px",
        borderRadius: "16px",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0d0d1f 0%, #0a0a15 100%)",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 9, 15], fov: 48 }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.25} />
        <directionalLight
          castShadow
          position={[5, 14, 8]}
          intensity={1.3}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, 7, -4]} intensity={1.0} color="#6366f1" />
        <pointLight position={[-9, 5, 4]} intensity={0.5} color="#ec4899" />
        <pointLight position={[9, 5, 4]} intensity={0.5} color="#22d3ee" />
        {/* Extra warm light over selected seats */}
        {selectedSeats.length > 0 && (
          <pointLight position={[0, 6, 4]} intensity={0.8} color="#f59e0b" />
        )}

        {/* Atmospheric fog */}
        <fog attach="fog" args={["#08080f", 22, 48]} />

        {/* Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.12, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0b0b18" roughness={1} />
        </mesh>

        {/* Stage */}
        <Stage />

        {/* Stage text */}
        <Text
          position={[0, 0.06, -5.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.48}
          color="rgba(255,255,255,0.2)"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          ★  S T A G E  ★
        </Text>

        {/* Seats */}
        {seats.map((seat, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const totalCols = Math.min(seats.length, COLS);
          const offsetX = ((totalCols - 1) * GAP_X) / 2;
          const x = col * GAP_X - offsetX;
          const z = row * GAP_Z;
          return (
            <Seat
              key={seat.id}
              seat={seat}
              position={[x, 0, z]}
              isSelected={selectedIds.has(seat.id)}
              onClick={onSeatClick}
            />
          );
        })}

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 2]}
        />
      </Canvas>
    </div>
  );
}

