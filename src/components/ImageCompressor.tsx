import React, { useCallback, useState } from 'react';
import { Upload, Info, Cpu, Layers, Gauge, Binary } from 'lucide-react';
import { ImageDeepCABAC } from '../lib/ImageDeepCABAC';

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export function ImageCompressor() {
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setError(null);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Load image into canvas
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Compress image
      const compressor = new ImageDeepCABAC({
        blockSize: 8,
        quantizationLevel: 16,
        colorSpace: 'YCbCr'
      });

      const compressed = await compressor.compress(imageData);

      // Calculate compression stats
      const originalSize = file.size;
      const compressedSize = JSON.stringify(compressed).length;

      setResult({
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        width: imageData.width,
        height: imageData.height
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress image');
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Image Compression</h2>
      </div>

      {/* DeepCABAC Algorithm Information */}
      <div className="mb-6 bg-indigo-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-indigo-900">DeepCABAC Algorithm</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-indigo-800">Neural Compression</span>
              </div>
              <p className="text-indigo-700 text-xs">
                Uses deep learning for efficient context modeling and entropy coding
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-indigo-800">Block Processing</span>
              </div>
              <p className="text-indigo-700 text-xs">
                Processes image in 8×8 pixel blocks for optimal compression
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-indigo-800">Adaptive Quantization</span>
              </div>
              <p className="text-indigo-700 text-xs">
                Dynamic bit allocation based on visual importance
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Binary className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-indigo-800">Entropy Coding</span>
              </div>
              <p className="text-indigo-700 text-xs">
                Advanced arithmetic coding for maximum compression
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-indigo-600">
            <p>Current Settings:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Block Size: 8×8 pixels</li>
              <li>Quantization Levels: 16</li>
              <li>Color Space: YCbCr (for better compression)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {isCompressing ? 'Compressing...' : 'Upload image to compress'}
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-indigo-700">
                  Compression Ratio
                </span>
                <span className="text-lg font-bold text-indigo-700">
                  {result.compressionRatio.toFixed(2)}x
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{
                    width: `${(1 / result.compressionRatio) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                Higher ratio means better compression efficiency
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Original Size</div>
                <div className="text-lg font-semibold">
                  {(result.originalSize / 1024).toFixed(2)} KB
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Compressed Size</div>
                <div className="text-lg font-semibold">
                  {(result.compressedSize / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Image Details</div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-xs text-gray-500">Dimensions</div>
                  <div className="text-sm font-medium">
                    {result.width} × {result.height}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Space Saved</div>
                  <div className="text-sm font-medium">
                    {((1 - (result.compressedSize / result.originalSize)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}