import * as THREE from 'three';

/**
 * Generates a procedural noise texture using a canvas.
 * Useful for breaking up flat surfaces with subtle roughness or bump maps.
 */
export function generateNoiseTexture(size = 256, scale = 1.0, opacity = 1.0) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Generate random greyscale value
        const val = Math.random() * 255 * opacity;
        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(scale, scale);
    texture.needsUpdate = true;

    return texture;
}

/**
 * Generates a more structured "grain" or "perlin-like" noise if needed, 
 * but for subtle surface variation, basic white noise is often sufficient and faster.
 */
export function generateSoftNoiseTexture(size = 256, opacity = 0.5) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Fill with base grey
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, size, size);

    // Add random specks
    for (let i = 0; i < (size * size) / 2; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const gray = Math.random() * 255;
        ctx.fillStyle = `rgba(${gray},${gray},${gray},${opacity})`;
        ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}
