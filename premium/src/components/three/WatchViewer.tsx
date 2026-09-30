'use client';

import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import type { FinishKey, Model3d } from '@/domain/catalog';

import { FINISH_COLORS } from './finish-colors';

interface WatchProps {
  shape: Model3d['caseShape'];
  strap: Model3d['strap'];
  finish: FinishKey;
  dial: string;
}

/**
 * Reloj procedural parametrizado (forma de caja, correa, acabado, esfera). Sin archivos de modelo externos.
 * Marco local: la esfera mira a +Y, las 12 h a −Z. El grupo exterior lo gira para que la esfera mire a cámara (+Z).
 */
function Watch({ shape, strap, finish, dial }: WatchProps) {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: FINISH_COLORS[finish].color, metalness: 1, roughness: 0.2, envMapIntensity: 1.35 }), [finish]);
  const dialMat = useMemo(() => new THREE.MeshStandardMaterial({ color: dial, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.45 }), [dial]);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0, envMapIntensity: 0.35, depthWrite: false }), []);
  const handMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e2d4', metalness: 1, roughness: 0.25 }), []);

  const dims = shape === 'round' ? { w: 2, h: 2 } : shape === 'square' ? { w: 1.9, h: 1.9 } : { w: 1.6, h: 2.2 };
  const c = new THREE.Color(dial);
  const dark = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b < 0.3;
  const marker = dark ? '#e8e2d4' : '#3a3630';

  // Correa en bucle: elipse en el plano Y–Z que parte de las esquinas inferiores de la caja.
  const links = useMemo(() => {
    const n = strap === 'mesh' ? 72 : 30;
    const zc = dims.h / 2 - 0.02;
    const phiGap = (70 * Math.PI) / 180;
    const az = zc / Math.sin(phiGap);
    const ay = 1.55;
    const yc = -0.21 - ay * Math.cos(phiGap);
    return Array.from({ length: n }, (_, i) => {
      const phi = phiGap + (i / (n - 1)) * (Math.PI * 2 - 2 * phiGap);
      return { y: yc + ay * Math.cos(phi), z: az * Math.sin(phi), rot: Math.atan2(ay * Math.sin(phi), az * Math.cos(phi)) };
    });
  }, [strap, dims.h]);

  const ringR = dims.w / 2;
  const hand = (angle: number, length: number, y: number, thickness: number) => (
    <mesh material={handMat} position={[(Math.sin(angle) * length) / 2, y, (-Math.cos(angle) * length) / 2]} rotation={[0, Math.PI - angle, 0]}>
      <boxGeometry args={[thickness, 0.02, length]} />
    </mesh>
  );

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Caja */}
      {shape === 'round' ? (
        <mesh material={metal}>
          <cylinderGeometry args={[ringR, ringR, 0.42, 72]} />
        </mesh>
      ) : (
        <RoundedBox args={[dims.w, 0.42, dims.h]} radius={shape === 'square' ? 0.16 : 0.14} smoothness={4} material={metal} />
      )}

      {/* Bisel */}
      {shape === 'round' ? (
        <mesh material={metal} position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ringR - 0.05, 0.07, 24, 96]} />
        </mesh>
      ) : (
        // Marco de cuatro barras: un bloque macizo taparía la esfera.
        <group position={[0, 0.22, 0]}>
          {([-1, 1] as const).map((k) => (
            <group key={k}>
              <RoundedBox args={[dims.w - 0.06, 0.06, 0.18]} radius={0.025} smoothness={2} material={metal} position={[0, 0, (k * (dims.h - 0.24)) / 2]} />
              <RoundedBox args={[0.18, 0.06, dims.h - 0.06]} radius={0.025} smoothness={2} material={metal} position={[(k * (dims.w - 0.24)) / 2, 0, 0]} />
            </group>
          ))}
        </group>
      )}

      {/* Esfera */}
      {shape === 'round' ? (
        <mesh material={dialMat} position={[0, 0.2, 0]}>
          <cylinderGeometry args={[ringR - 0.16, ringR - 0.16, 0.04, 64]} />
        </mesh>
      ) : (
        <RoundedBox args={[dims.w - 0.34, 0.04, dims.h - 0.34]} radius={0.015} smoothness={2} material={dialMat} position={[0, 0.2, 0]} />
      )}

      {/* Marcas de hora */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const rx = shape === 'round' ? ringR - 0.34 : shape === 'square' ? 0.68 : 0.55;
        const rz = shape === 'round' ? ringR - 0.34 : shape === 'square' ? 0.68 : 0.9;
        const long = i % 3 === 0;
        return (
          <mesh key={i} position={[Math.sin(a) * rx, 0.235, -Math.cos(a) * rz]} rotation={[0, Math.PI - a, 0]}>
            <boxGeometry args={[long ? 0.07 : 0.035, 0.02, long ? 0.2 : 0.1]} />
            <meshStandardMaterial color={marker} metalness={0.6} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Agujas (10:10) */}
      {hand((5 * Math.PI) / 3, 0.62, 0.26, 0.06)}
      {hand(Math.PI / 3, 0.85, 0.28, 0.045)}
      <mesh material={metal} position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 24]} />
      </mesh>

      {/* Cristal */}
      {shape === 'round' ? (
        <mesh material={glass} position={[0, 0.27, 0]}>
          <cylinderGeometry args={[ringR - 0.1, ringR - 0.1, 0.02, 64]} />
        </mesh>
      ) : (
        <RoundedBox args={[dims.w - 0.14, 0.02, dims.h - 0.14]} radius={0.008} smoothness={2} material={glass} position={[0, 0.27, 0]} />
      )}

      {/* Corona */}
      <mesh material={metal} position={[dims.w / 2 + 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.14, 20]} />
      </mesh>

      {/* Correa */}
      {links.map((l, i) => (
        <mesh key={i} material={metal} position={[0, l.y, l.z]} rotation={[l.rot, 0, 0]}>
          <boxGeometry args={[strap === 'mesh' ? 1.02 : 0.98, 0.07, strap === 'mesh' ? 0.14 : 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

function Studio() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      <Lightformer form="rect" intensity={3.2} color="#fff4e0" position={[0, 4, 3]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#e8eefc" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[5, 0, -2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer form="circle" intensity={2} color="#ffe9c8" position={[0, -3, 3]} scale={4} />
      <Lightformer form="rect" intensity={0.9} color="#fff8ee" position={[0, 0, 6]} scale={[7, 7, 1]} />
    </Environment>
  );
}

interface WatchViewerProps {
  model: Model3d;
  finish: FinishKey;
  dial: string;
  autoRotate: boolean;
  onContextLost: () => void;
}

export default function WatchViewer({ model, finish, dial, autoRotate, onContextLost }: WatchViewerProps) {
  const [dragging, setDragging] = useState(false);
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.6, 7], fov: 32 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
    >
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} />
      <group position={[0, 0.2, 0]} scale={1.05}>
        <Watch shape={model.caseShape} strap={model.strap} finish={finish} dial={dial} />
      </group>
      <ContactShadows position={[0, -1.9, 0]} opacity={0.35} scale={9} blur={2.6} far={4} />
      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={4.5}
        maxDistance={10}
        autoRotate={autoRotate && !dragging}
        autoRotateSpeed={1.4}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI - 0.7}
        onStart={() => setDragging(true)}
      />
    </Canvas>
  );
}
