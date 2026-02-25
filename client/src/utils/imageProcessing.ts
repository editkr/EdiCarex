/**
 * Utility for advanced logo processing:
 * - Automatic background removal (removes white/solid backgrounds)
 * - Intelligent cropping (removes empty space/margins)
 */

export interface ProcessedImage {
    file: File;
    preview: string;
}

/**
 * Removes the background from an image file if it's solid (like white).
 * Also crops the image to fit the logo.
 */
export async function processLogoImage(file: File): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 1. Robust Background Detection (Perimeter Sampling)
            const edgeData: number[][] = [];
            const step = 2; // Sample every 2 pixels

            // Top and Bottom
            for (let x = 0; x < canvas.width; x += step) {
                edgeData.push(Array.from(ctx.getImageData(x, 0, 1, 1).data));
                edgeData.push(Array.from(ctx.getImageData(x, canvas.height - 1, 1, 1).data));
            }
            // Left and Right
            for (let y = 0; y < canvas.height; y += step) {
                edgeData.push(Array.from(ctx.getImageData(0, y, 1, 1).data));
                edgeData.push(Array.from(ctx.getImageData(canvas.width - 1, y, 1, 1).data));
            }

            // Find most frequent color in edges
            const colorCounts: Record<string, { count: number, rgb: number[] }> = {};
            edgeData.forEach(rgba => {
                const key = `${Math.floor(rgba[0] / 10) * 10},${Math.floor(rgba[1] / 10) * 10},${Math.floor(rgba[2] / 10) * 10}`;
                if (!colorCounts[key]) colorCounts[key] = { count: 0, rgb: rgba };
                colorCounts[key].count++;
            });

            const sortedColors = Object.values(colorCounts).sort((a, b) => b.count - a.count);
            const mostLikelyBG = sortedColors[0].rgb;

            const bgR = mostLikelyBG[0];
            const bgG = mostLikelyBG[1];
            const bgB = mostLikelyBG[2];
            const tolerance = 50;

            // 2. Remove identified background
            for (let i = 0; i < data.length; i += 4) {
                const dr = Math.abs(data[i] - bgR);
                const dg = Math.abs(data[i + 1] - bgG);
                const db = Math.abs(data[i + 2] - bgB);

                if (dr < tolerance && dg < tolerance && db < tolerance) {
                    data[i + 3] = 0; // Transparent
                }
            }

            // 3. Smart Contrast (Ensure the remaining logo is visible)
            // If the remaining non-transparent pixels are too light and we are in a context that might be light
            // or vice-versa, we can suggest/apply a subtle drop shadow or outline.
            // For now, we'll just put the cleaned data back.
            ctx.putImageData(imageData, 0, 0);

            // 3. Auto-crop (Find bounding box of non-transparent pixels)
            const bounds = {
                top: canvas.height,
                left: canvas.width,
                right: 0,
                bottom: 0
            };

            let hasVisiblePixels = false;
            const updatedData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alpha = updatedData[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 0) {
                        hasVisiblePixels = true;
                        if (x < bounds.left) bounds.left = x;
                        if (x > bounds.right) bounds.right = x;
                        if (y < bounds.top) bounds.top = y;
                        if (y > bounds.bottom) bounds.bottom = y;
                    }
                }
            }

            if (!hasVisiblePixels) {
                // If everything is transparent, return original
                resolve({ file, preview: URL.createObjectURL(file) });
                return;
            }

            // Add a small padding (5px)
            const padding = 5;
            bounds.left = Math.max(0, bounds.left - padding);
            bounds.top = Math.max(0, bounds.top - padding);
            bounds.right = Math.min(canvas.width, bounds.right + padding);
            bounds.bottom = Math.min(canvas.height, bounds.bottom + padding);

            const trimWidth = bounds.right - bounds.left;
            const trimHeight = bounds.bottom - bounds.top;

            const trimmedCanvas = document.createElement('canvas');
            trimmedCanvas.width = trimWidth;
            trimmedCanvas.height = trimHeight;
            const trimmedCtx = trimmedCanvas.getContext('2d');

            if (!trimmedCtx) {
                reject(new Error('Could not get trimmed canvas context'));
                return;
            }

            trimmedCtx.drawImage(
                canvas,
                bounds.left, bounds.top, trimWidth, trimHeight,
                0, 0, trimWidth, trimHeight
            );

            // 4. Convert back to File
            trimmedCanvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Blob conversion failed'));
                    return;
                }
                const processedFile = new File([blob], file.name, { type: 'image/png' });
                resolve({
                    file: processedFile,
                    preview: trimmedCanvas.toDataURL('image/png')
                });
            }, 'image/png');
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
