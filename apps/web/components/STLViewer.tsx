'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface STLViewerProps {
  file: File | null;
  width?: number;
  height?: number;
}

export default function STLViewer({ file, width = 400, height = 400 }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file || !containerRef.current) return;

    // Clear previous content
    if (containerRef.current.firstChild) {
      containerRef.current.innerHTML = '';
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2332);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Load STL file
    const loader = new STLLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contents = e.target?.result as ArrayBuffer;
        if (!contents) return;

        const geometry = loader.parse(contents);
        const material = new THREE.MeshStandardMaterial({
          color: 0x3a4552,
          metalness: 0.5,
          roughness: 0.5,
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        // Center the mesh
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const center = new THREE.Vector3();
        box.getCenter(center);
        mesh.position.sub(center);

        // Adjust camera to fit the model perfectly in viewport
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Calculate optimal distance using camera FOV
        // This ensures the model fills ~80% of the viewport
        const fov = camera.fov * (Math.PI / 180);
        const aspect = width / height;
        const modelRadius = maxDim / 2;
        
        // Calculate distance needed to fit model with padding
        const distance = modelRadius / Math.tan(fov / 2);
        
        // Scale by aspect ratio for proper fitting (use the smaller dimension for tight fit)
        const fitDistance = distance * 0.85; // 85% to fill viewport nicely
        
        camera.position.z = Math.max(fitDistance, maxDim * 0.8);
        camera.lookAt(0, 0, 0);

        // Animation loop for rotation (slower rotation)
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          if (meshRef.current) {
            meshRef.current.rotation.y += 0.003; // Slower: was 0.01
            meshRef.current.rotation.x += 0.0015; // Slower: was 0.005
          }
          renderer.render(scene, camera);
        };
        animate();
      } catch (error) {
        console.error('Error loading STL:', error);
      }
    };

    reader.readAsArrayBuffer(file);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (meshRef.current) {
        const geometry = meshRef.current.geometry;
        if (geometry) geometry.dispose();
        const material = meshRef.current.material as THREE.Material;
        if (material) material.dispose();
      }
    };
  }, [file, width, height]);

  if (!file) return null;

  return (
    <div className="flex flex-col items-center mt-4">
      <div ref={containerRef} className="border border-[#253242] bg-[#1a2332]" />
      <p className="text-[#9ca3af] text-sm mt-2">Rotating 3D Preview</p>
    </div>
  );
}
