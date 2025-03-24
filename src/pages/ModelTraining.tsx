import React, { useState } from 'react';
import { Brain, Database, Info, Layers, Cpu, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useModelTraining, { DatasetType } from '../hooks/useModelTraining';

const ModelTraining: React.FC = () => {
  const { 
    handleTrain, 
    isTraining, 
    trainingProgress, 
    error: trainingError,
    model,
    isLoadingDataset,
    datasetLoadingProgress,
    datasets,
  } = useModelTraining();
  
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('synthetic');
  const [epochs, setEpochs] = useState<number>(10);
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

  const handleStartTraining = () => {
    if (epochs <= 0 || epochs > 100) {
      setError('Please enter a valid number of epochs (1-100)');
      return;
    }
    
    setError(null);
    handleTrain(selectedDataset, epochs);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Training</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Train neural network models on different datasets
        </p>
      </div>

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
            {Object.entries(datasets).map(([type, info]) => (
              <div
                key={type}
                className={`relative flex items-center p-4 cursor-pointer rounded-lg border-2 transition-colors ${
                  selectedDataset === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
                onClick={() => setSelectedDataset(type as DatasetType)}
              >
                <Database className={`w-5 h-5 ${
                  selectedDataset === type ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{info.name}</h3>
                  <p className="text-xs text-gray-500">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Epochs Configuration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Epochs
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="1"
              max="100"
              value={epochs}
              onChange={(e) => setEpochs(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="block w-24 px-3 py-2 mr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              Higher values may improve accuracy but take longer to train (recommended: 10-25)
            </span>
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
          onClick={handleStartTraining}
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
    </div>
  );
};

export default ModelTraining;