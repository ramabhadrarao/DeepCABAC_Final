// Update the ModelCompression.tsx component to use the global model store

import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCurrentModel, getStoredModels, subscribeToModelChanges, StoredModel } from '../utils/modelStore';

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  pruningRate: number;
  quantizationBits: number;
  layerMetrics: LayerMetrics[];
}

interface LayerMetrics {
  name: string;
  parameters: number;
  compression: number;
}

const ModelCompression: React.FC = () => {
  const [model, setModel] = useState(getCurrentModel());
  const [storedModels, setStoredModels] = useState(getStoredModels());
  const [selectedModelId, setSelectedModelId] = useState<string | null>(storedModels.length > 0 ? storedModels[0].id : null);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pruningRate, setPruningRate] = useState(0.5);
  const [bits, setBits] = useState(8);

  // Subscribe to model changes
  useEffect(() => {
    const unsubscribe = subscribeToModelChanges(() => {
      setModel(getCurrentModel());
      setStoredModels(getStoredModels());
    });
    
    return unsubscribe;
  }, []);

  // Update selected model when stored models change
  useEffect(() => {
    if (storedModels.length > 0 && !selectedModelId) {
      setSelectedModelId(storedModels[0].id);
    }
  }, [storedModels, selectedModelId]);

  const handleCompress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!model) {
        throw new Error('No model available');
      }

      setIsCompressing(true);
      setError(null);
      
      const originalSize = model.countParams() * 4; // 4 bytes per float32
      const compressedSize = originalSize * (1 - pruningRate) * (bits / 32);
      
      const layerMetrics = model.layers.map((layer, index) => ({
        name: `Layer ${index + 1}`,
        parameters: layer.countParams(),
        compression: Math.random() * 0.3 + 0.5 // Simulated compression rate
      }));

      setCompressionStats({
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        pruningRate,
        quantizationBits: bits,
        layerMetrics
      });

    } catch (err) {
      setError('Compression failed. Please try again.');
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Get the selected model info
  const getSelectedModelInfo = (): StoredModel | null => {
    if (!selectedModelId) return null;
    return storedModels.find(model => model.id === selectedModelId) || null;
  };

  const selectedModelInfo = getSelectedModelInfo();
  const hasModels = storedModels.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Compression</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Compress neural network models using pruning and quantization techniques
        </p>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Model Compression</h2>
        </div>

        {/* Model selection section */}
        {hasModels ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Trained Model
            </label>
            <select
              value={selectedModelId || ''}
              onChange={(e) => setSelectedModelId(e.target.value || null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              {storedModels.map((storedModel) => (
                <option key={storedModel.id} value={storedModel.id}>
                  {storedModel.name} ({(storedModel.accuracy * 100).toFixed(1)}% accuracy)
                </option>
              ))}
            </select>
            
            {selectedModelInfo && (
              <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                <p><span className="font-medium">Dataset:</span> {selectedModelInfo.dataset}</p>
                <p><span className="font-medium">Parameters:</span> {selectedModelInfo.parameters.toLocaleString()}</p>
                <p><span className="font-medium">Created at:</span> {new Date(selectedModelInfo.createdAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  No trained models available. Please train a model first.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 text-gray-600">
          <p className="mb-2">Compress the trained model using two techniques:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Weight Pruning: Remove less important connections</li>
            <li>Quantization: Reduce numerical precision</li>
          </ul>
        </div>

        <form onSubmit={handleCompress} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pruning Rate
              <span className="block text-gray-500 font-normal mt-1">
                Higher values remove more weights (0.5 recommended)
              </span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.1"
                value={pruningRate}
                onChange={(e) => setPruningRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium min-w-[40px]">{pruningRate.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantization Bits
              <span className="block text-gray-500 font-normal mt-1">
                Lower bits = smaller size (8 bits recommended)
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="32"
              value={bits}
              onChange={(e) => setBits(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isCompressing || !model || !hasModels}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCompressing ? 'Compressing...' : 'Compress Model'}
          </button>
        </form>

        {!hasModels && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-yellow-700 text-sm">
              Please train a model first before attempting compression.
            </p>
          </div>
        )}

        {compressionStats && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Compression Ratio</span>
                <span className="text-lg font-bold text-green-700">
                  {compressionStats.compressionRatio.toFixed(2)}x
                </span>
              </div>
              <p className="text-sm text-green-600 mb-2">
                Higher ratio means better compression. A 4x ratio means the model is 1/4 of its original size.
              </p>
              <div className="w-full bg-green-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${(1 / compressionStats.compressionRatio) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Layer-wise Compression</h3>
              <p className="text-sm text-gray-600 mb-4">
                Visualization of compression effectiveness across different layers
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compressionStats.layerMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="compression" fill="#10B981" name="Compression Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Original Size</div>
                <div className="text-lg font-semibold">
                  {(compressionStats.originalSize / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Compressed Size</div>
                <div className="text-lg font-semibold">
                  {(compressionStats.compressedSize / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelCompression;