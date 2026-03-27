import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const PARTICLE_COUNT = 600;

function createParticleBuffers() {
  const whitePositions = [];
  const yellowPositions = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 10 - 5;

    if (Math.random() > 0.8) {
      yellowPositions.push(x, y, z);
    } else {
      whitePositions.push(x, y, z);
    }
  }

  return {
    whiteArr: new Float32Array(whitePositions),
    yellowArr: new Float32Array(yellowPositions),
  };
}

const PARTICLE_BUFFERS = createParticleBuffers();

function Particles() {
  const { whiteArr, yellowArr } = PARTICLE_BUFFERS;

  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y += delta * 0.2;
      if (groupRef.current.position.y > 10) groupRef.current.position.y = -10;
      groupRef.current.rotation.x = -state.pointer.y * 0.03;
      groupRef.current.rotation.y = state.pointer.x * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={whiteArr.length / 3} array={whiteArr} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#ffffff" transparent opacity={0.3} sizeAttenuation depthWrite={false} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={yellowArr.length / 3} array={yellowArr} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#FFE135" transparent opacity={0.15} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <Particles />
    </Canvas>
  );
}
