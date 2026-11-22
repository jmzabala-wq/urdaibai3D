import * as THREE from 'three';

export interface ProceduralTextures {
  asphaltMap: THREE.CanvasTexture;
  terrainBumpMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  // 1. Road asphalt with white edge lines and dashed center stripe
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 256;
  roadCanvas.height = 256;
  const rctx = roadCanvas.getContext('2d')!;
  rctx.fillStyle = '#303640';
  rctx.fillRect(0, 0, 256, 256);

  // Subtle asphalt grain
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 38 + Math.floor(Math.random() * 28);
    rctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    rctx.fillRect(x, y, 2, 2);
  }
  // Edge lines
  rctx.fillStyle = '#d8dee6';
  rctx.fillRect(10, 0, 5, 256);
  rctx.fillRect(241, 0, 5, 256);
  // Dashed centerline
  rctx.fillStyle = '#f5b841';
  for (let y = 16; y < 256; y += 64) {
    rctx.fillRect(125, y, 6, 36);
  }
  const asphaltMap = new THREE.CanvasTexture(roadCanvas);
  asphaltMap.colorSpace = THREE.SRGBColorSpace;
  asphaltMap.wrapS = THREE.RepeatWrapping;
  asphaltMap.wrapT = THREE.RepeatWrapping;
  asphaltMap.anisotropy = maxAnisotropy;

  // 2. Terrain micro-detail bump map (linear NoColorSpace)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 90 + Math.floor(Math.random() * 80);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.fillRect(x, y, 3, 3);
  }
  const terrainBumpMap = new THREE.CanvasTexture(bumpCanvas);
  terrainBumpMap.wrapS = THREE.RepeatWrapping;
  terrainBumpMap.wrapT = THREE.RepeatWrapping;
  terrainBumpMap.repeat.set(36, 36);
  terrainBumpMap.anisotropy = maxAnisotropy;

  // 3. Soft radial contact shadow
  const shadCanvas = document.createElement('canvas');
  shadCanvas.width = 128;
  shadCanvas.height = 128;
  const sctx = shadCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(5, 10, 18, 0.72)');
  grad.addColorStop(0.55, 'rgba(5, 10, 18, 0.32)');
  grad.addColorStop(1, 'rgba(5, 10, 18, 0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  // 4. Basque limestone masonry texture
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = 256;
  stoneCanvas.height = 256;
  const stctx = stoneCanvas.getContext('2d')!;
  stctx.fillStyle = '#cfc7b8';
  stctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) {
    const y = row * 32;
    const offset = (row % 2) * 32;
    for (let col = -1; col < 5; col++) {
      const x = col * 64 + offset;
      const shade = 185 + Math.floor(Math.random() * 32);
      stctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 18})`;
      stctx.fillRect(x + 2, y + 2, 60, 28);
    }
  }
  const stoneMap = new THREE.CanvasTexture(stoneCanvas);
  stoneMap.colorSpace = THREE.SRGBColorSpace;
  stoneMap.wrapS = THREE.RepeatWrapping;
  stoneMap.wrapT = THREE.RepeatWrapping;
  stoneMap.anisotropy = maxAnisotropy;

  return { asphaltMap, terrainBumpMap, contactShadowMap, stoneMap };
}
