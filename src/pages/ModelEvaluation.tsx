import React, { useState } from 'react';
import { Activity, AlertTriangle, Info } from 'lucide-react';
import { useModelTrainingContext } from '../contexts/ModelContext';
import { useAuth } from '../contexts/AuthContext';

const ModelEvaluation: React.FC = () => {
  const { 
    model, 
    evaluateModel, 
    selectedDataset, 
    storedModels,
    selectedModelId,
    selectModel,
    getSelectedModelInfo
  } = useModelTrainingContext();
  
  const { isAdmin } = useAuth();
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there are any models available
  const hasModels = storedModels.length > 0;
  
  // Get the selected model info
  const selectedModelInfo = getSelectedModelInfo();

  const handleEvaluate = async () => {
    try {
      if (!model) {
        throw new Error('No model available for evaluation');
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Evaluation</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Evaluate the performance of compressed neural network models
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
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Model Evaluation</h2>
        </div>

        {/* Model selection section */}
        {hasModels ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Trained Model
            </label>
            <select
              value={selectedModelId || ''}
              onChange={(e) => selectModel(e.target.value || null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              {storedModels.map((storedModel) => (
                <option key={storedModel.id} value={storedModel.id}>
                  {storedModel.name} ({storedModel.accuracy > 0 
                    ? `${(storedModel.accuracy * 100).toFixed(1)}% accuracy` 
                    : 'Accuracy unknown'})
                </option>
              ))}
            </select>
            
            {selectedModelInfo && (
              <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                <p><span className="font-medium">Dataset:</span> {selectedModelInfo.datasetType}</p>
                <p><span className="font-medium">Parameters:</span> {selectedModelInfo.parameters.toLocaleString()}</p>
                <p><span className="font-medium">Trained by:</span> {selectedModelInfo.trainedBy}</p>
                <p><span className="font-medium">Trained at:</span> {new Date(selectedModelInfo.trainedAt).toLocaleString()}</p>
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
                  {isAdmin 
                    ? "No trained models available. Please train a model first."
                    : "No trained models available. Please ask an administrator to train a model."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 text-gray-600">
          <p>Test the model's performance:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Evaluates model accuracy</li>
            <li>Measures performance impact</li>
            <li>Target: Maintain accuracy above 90%</li>
          </ul>
        </div>

        <div className="mb-8">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !model || !hasModels}
            className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEvaluating ? 'Evaluating...' : 'Evaluate Model'}
          </button>

          {!hasModels && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-yellow-700 text-sm">
                {isAdmin 
                  ? "Please train a model first before attempting evaluation."
                  : "Please wait for an administrator to train a model before evaluation."
                }
              </p>
            </div>
          )}
        </div>

        {accuracy !== null && (
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-purple-800 mb-2">Evaluation Results</h3>
              <div className="flex justify-center items-center">
                <svg className="w-16 h-16" viewBox="0 0 36 36" fill="none">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="#E9D5FF"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                    strokeDashoffset={100 - accuracy * 100}
                    fill="none"
                  />
                  <text
                    x="18"
                    y="20.5"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#8B5CF6"
                    fontWeight="bold"
                  >
                    {(accuracy * 100).toFixed(1)}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className="text-lg font-semibold">
                  {accuracy >= 0.9 ? (
                    <span className="text-green-600">Excellent</span>
                  ) : accuracy >= 0.8 ? (
                    <span className="text-yellow-600">Good</span>
                  ) : (
                    <span className="text-red-600">Needs Improvement</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Recommended Action</div>
                <div className="text-sm">
                  {accuracy >= 0.9
                    ? "Ready for deployment"
                    : accuracy >= 0.8
                    ? "Consider further compression tuning"
                    : "Retrain the model or reduce compression rate"}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Detailed Analysis</div>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  The model achieved {(accuracy * 100).toFixed(1)}% accuracy on the test dataset. 
                  {accuracy >= 0.9
                    ? " This indicates that the compression process preserved the model's ability to make accurate predictions."
                    : accuracy >= 0.8
                    ? " The compression has slightly reduced model accuracy, but it's still within an acceptable range."
                    : " The compression has significantly reduced model accuracy, which might impact performance in production."}
                </p>
                <p>
                  {accuracy >= 0.9
                    ? "The compressed model can be deployed with confidence."
                    : accuracy >= 0.8
                    ? "You may want to fine-tune the compression parameters or apply post-compression fine-tuning."
                    : "Consider decreasing the pruning rate or increasing the quantization bits to preserve more model information."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelEvaluation;