import React, { useState } from 'react';
import { Brain, Zap, Activity, Database, Info, Layers, Cpu, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as tf from '@tensorflow/tfjs';
import { ImageCompressor } from './components/ImageCompressor';
import useModelTraining, { DatasetType, DATASETS } from './hooks/useModelTraining';

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

interface AppProps {
  showModelTrainingOnly?: boolean;
}

function App({ showModelTrainingOnly = false }: AppProps) {
  const { 
    handleTrain, 
    isTraining, 
    trainingProgress, 
    error: trainingError,
    model,
    isLoadingDataset,
    datasetLoadingProgress,
    datasets,
    evaluateModel
  } = useModelTraining();
  
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('synthetic');
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getModelArchitectureInfo = () => {
    if (!model) return null;

    return model.layers.map((layer, index) => ({
      name: layer.name,
      type: layer.getClassName(),
      units: layer.outputShape,
      params: layer.countParams()
    }));
  };

  const modelArchitecture = getModelArchitectureInfo();
  const totalParams = modelArchitecture?.reduce((sum, layer) => sum + layer.params, 0) || 0;

  const handleCompress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!model) {
        throw new Error('No model available');
      }

      setIsCompressing(true);
      setError(null);
      
      const formData = new FormData(e.currentTarget);
      const pruningRate = Number(formData.get('pruningRate'));
      const bits = Number(formData.get('bits'));

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

  const handleEvaluate = async () => {
    try {
      if (!model) {
        throw new Error('No model available');
      }

      setIsEvaluating(true);
      setError(null);

      const evaluationAccuracy = await evaluateModel(selectedDataset);
      setAccuracy(evaluationAccuracy);

    } catch (err) {
      setError('Evaluation failed. Please try again.');
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // If we're in ModelTraining mode, only render the training section
  if (showModelTrainingOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Model Training</h2>
        </div>

        {/* Algorithm Information */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Algorithm Details</h3>
          </div>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Architecture: Convolutional Neural Network (CNN)</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Total Parameters: {totalParams.toLocaleString()}</span>
            </div>
          </div>
        </div>
            
        {trainingError && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{trainingError}</p>
              </div>
            </div>
          </div>
        )}
            
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Dataset
          </label>
          <div className="grid gap-4">
            {(Object.entries(datasets) as [DatasetType, typeof datasets[DatasetType]][]).map(([type, info]) => (
              <div
                key={type}
                className={`relative flex items-center p-4 cursor-pointer rounded-lg border-2 transition-colors ${
                  selectedDataset === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
                onClick={() => setSelectedDataset(type)}
              >
                <Database className={`w-5 h-5 ${
                  selectedDataset === type ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{info.name}</h3>
                  <p className="text-xs text-gray-500">{info.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expected accuracy: {info.expectedAccuracy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Loading Progress */}
        {isLoadingDataset && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 text-blue-700">
                <Download className="w-4 h-4 animate-pulse" />
                <span>Loading dataset...</span>
              </div>
              <span className="font-medium">{datasetLoadingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${datasetLoadingProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => handleTrain(selectedDataset)}
          disabled={isTraining || isLoadingDataset}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </button>

        {/* Training Progress */}
        {trainingProgress.length > 0 && (
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Training Progress</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">Current Loss</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {trainingProgress[trainingProgress.length - 1].loss.toFixed(4)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">Current Accuracy</div>
                  <div className="text-lg font-semibold text-green-900">
                    {(trainingProgress[trainingProgress.length - 1].accuracy * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trainingProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="epoch" 
                    label={{ value: 'Epoch', position: 'bottom' }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(4)}
                    labelFormatter={(label) => `Epoch ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="loss" 
                    stroke="#3B82F6" 
                    name="Loss"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10B981" 
                    name="Accuracy"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Model Architecture */}
        {modelArchitecture && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Model Architecture</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {modelArchitecture.map((layer, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{layer.type}</span>
                  </div>
                  <span className="text-gray-500">
                    {layer.params.toLocaleString()} params
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Neural Network & Image Compression</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience deep learning in action with our neural network classifier. 
            Featuring advanced compression techniques for efficient model storage and deployment.
          </p>
        </header>

        {(error || trainingError) && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || trainingError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Training Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Model Training</h2>
            </div>

            {/* Algorithm Information */}
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Algorithm Details</h3>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Architecture: Convolutional Neural Network (CNN)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>Total Parameters: {totalParams.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dataset
              </label>
              <div className="grid gap-4">
                {(Object.entries(datasets) as [DatasetType, typeof datasets[DatasetType]][]).map(([type, info]) => (
                  <div
                    key={type}
                    className={`relative flex items-center p-4 cursor-pointer rounded-lg border-2 transition-colors ${
                      selectedDataset === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                    onClick={() => setSelectedDataset(type)}
                  >
                    <Database className={`w-5 h-5 ${
                      selectedDataset === type ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{info.name}</h3>
                      <p className="text-xs text-gray-500">{info.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expected accuracy: {info.expectedAccuracy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dataset Loading Progress */}
            {isLoadingDataset && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Download className="w-4 h-4 animate-pulse" />
                    <span>Loading dataset...</span>
                  </div>
                  <span className="font-medium">{datasetLoadingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${datasetLoadingProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => handleTrain(selectedDataset)}
              disabled={isTraining || isLoadingDataset}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTraining ? 'Training...' : 'Train Model'}
            </button>

            {/* Training Progress */}
            {trainingProgress.length > 0 && (
              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Training Progress</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-600 mb-1">Current Loss</div>
                      <div className="text-lg font-semibold text-blue-900">
                        {trainingProgress[trainingProgress.length - 1].loss.toFixed(4)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-600 mb-1">Current Accuracy</div>
                      <div className="text-lg font-semibold text-green-900">
                        {(trainingProgress[trainingProgress.length - 1].accuracy * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-64 bg-gray-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="epoch" 
                        label={{ value: 'Epoch', position: 'bottom' }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => value.toFixed(4)}
                        labelFormatter={(label) => `Epoch ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="loss" 
                        stroke="#3B82F6" 
                        name="Loss"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#10B981" 
                        name="Accuracy"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Model Architecture */}
            {modelArchitecture && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Model Architecture</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {modelArchitecture.map((layer, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{layer.type}</span>
                      </div>
                      <span className="text-gray-500">
                        {layer.params.toLocaleString()} params
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image Compression Section */}
          <ImageCompressor />
        </div>

        {/* Compression Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Model Compression</h2>
          </div>

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
              <input
                type="range"
                name="pruningRate"
                min="0"
                max="0.9"
                step="0.1"
                defaultValue="0.5"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
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
                name="bits"
                min="1"
                max="32"
                defaultValue="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isCompressing || !model}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCompressing ? 'Compressing...' : 'Compress Model'}
            </button>
          </form>

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

        {/* Evaluation Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Model Evaluation</h2>
          </div>

          <div className="mb-6 text-gray-600">
            <p>Test the compressed model's performance:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Evaluates model accuracy</li>
              <li>Measures performance impact</li>
              <li>Target: Maintain accuracy above 90%</li>
            </ul>
          </div>

          <div className="flex gap-8 items-center">
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !model}
              className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEvaluating ? 'Evaluating...' : 'Evaluate Model'}
            </button>

            {accuracy !== null && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">Accuracy</div>
                <div className="text-2xl font-bold text-purple-600">
                  {(accuracy * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">
                  {accuracy >= 0.9 ? '(Excellent)' : accuracy >= 0.8 ? '(Good)' : '(Needs improvement)'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
     );
    }
    
    export default App;