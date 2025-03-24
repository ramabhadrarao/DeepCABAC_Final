import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as tf from '@tensorflow/tfjs';
import useModelTraining, { DatasetType } from '../hooks/useModelTraining';

// Create a model info type that can be serialized
interface StoredModelInfo {
  id: string;
  name: string;
  datasetType: DatasetType;
  parameters: number;
  accuracy: number;
  trainedBy: string;
  trainedAt: string;
  modelJson?: any; // Model architecture serialized
}

interface ModelContextType {
  model: tf.LayersModel | null;
  selectedDataset: DatasetType;
  setSelectedDataset: (dataset: DatasetType) => void;
  trainingProgress: any[];
  isTraining: boolean;
  handleTrain: (datasetType: DatasetType, epochs?: number) => Promise<void>;
  evaluateModel: (datasetType: DatasetType) => Promise<number>;
  error: string | null;
  // New model management features
  storedModels: StoredModelInfo[];
  selectedModelId: string | null;
  selectModel: (modelId: string | null) => void;
  saveCurrentModel: (name: string) => Promise<void>;
  getSelectedModelInfo: () => StoredModelInfo | null;
  loadModel: (modelId: string) => Promise<void>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Helper function to get stored models from localStorage
const getStoredModels = (): StoredModelInfo[] => {
  try {
    const storedModels = localStorage.getItem('storedModels');
    return storedModels ? JSON.parse(storedModels) : [];
  } catch (error) {
    console.error('Error retrieving stored models:', error);
    return [];
  }
};

// Save stored models to localStorage
const saveStoredModels = (models: StoredModelInfo[]) => {
  try {
    localStorage.setItem('storedModels', JSON.stringify(models));
  } catch (error) {
    console.error('Error saving stored models:', error);
  }
};

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const modelTraining = useModelTraining();
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('synthetic');
  const [storedModels, setStoredModels] = useState<StoredModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Load stored models on initial render
  useEffect(() => {
    const models = getStoredModels();
    setStoredModels(models);
    
    // If there are models, select the most recent one by default
    if (models.length > 0) {
      setSelectedModelId(models[0].id);
    }
  }, []);

  // Save the current model to the stored models
  const saveCurrentModel = async (name: string): Promise<void> => {
    if (!modelTraining.model) {
      throw new Error('No model available to save');
    }

    try {
      // Generate a unique ID
      const id = `model_${Date.now()}`;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const username = user.username || 'Unknown User';
      
      // Create model info
      const newModelInfo: StoredModelInfo = {
        id,
        name: name || `Model ${storedModels.length + 1}`,
        datasetType: selectedDataset,
        parameters: modelTraining.model.countParams(),
        accuracy: 0, // Will be updated after evaluation
        trainedBy: username,
        trainedAt: new Date().toISOString(),
      };

      // Add to stored models
      const updatedModels = [newModelInfo, ...storedModels];
      setStoredModels(updatedModels);
      saveStoredModels(updatedModels);
      
      // Select the newly saved model
      setSelectedModelId(id);
      
      // Update the model's accuracy through evaluation
      try {
        const accuracy = await modelTraining.evaluateModel(selectedDataset);
        
        // Update model info with accuracy
        const updatedModelInfo = { ...newModelInfo, accuracy };
        const updatedModelsWithAccuracy = updatedModels.map(model => 
          model.id === id ? updatedModelInfo : model
        );
        
        setStoredModels(updatedModelsWithAccuracy);
        saveStoredModels(updatedModelsWithAccuracy);
      } catch (error) {
        console.error('Error evaluating model:', error);
        // Continue anyway, just without accuracy information
      }

    } catch (error) {
      console.error('Error saving model:', error);
      throw new Error('Failed to save model');
    }
  };

  // Helper to get the selected model info
  const getSelectedModelInfo = (): StoredModelInfo | null => {
    if (!selectedModelId) return null;
    return storedModels.find(model => model.id === selectedModelId) || null;
  };

  // Load a model by its ID (in a real app, this would load from a server)
  const loadModel = async (modelId: string): Promise<void> => {
    // Just set the selected model ID for now
    // In a real application, you would load the model weights from storage
    setSelectedModelId(modelId);
  };

  // Function to select a model
  const selectModel = (modelId: string | null) => {
    setSelectedModelId(modelId);
  };

  // Modified handleTrain to save the model after training
  const handleTrain = async (datasetType: DatasetType, epochs?: number): Promise<void> => {
    try {
      // Train the model using the original hook
      await modelTraining.handleTrain(datasetType, epochs);
      
      // If training was successful and we have a model, save it
      if (modelTraining.model) {
        // Auto-generate a name 
        const autoName = `${datasetType.toUpperCase()} Model - ${new Date().toLocaleString()}`;
        await saveCurrentModel(autoName);
      }
    } catch (error) {
      console.error('Error in handleTrain:', error);
      throw error;
    }
  };

  return (
    <ModelContext.Provider
      value={{
        model: modelTraining.model,
        selectedDataset,
        setSelectedDataset,
        trainingProgress: modelTraining.trainingProgress,
        isTraining: modelTraining.isTraining,
        handleTrain,
        evaluateModel: modelTraining.evaluateModel,
        error: modelTraining.error,
        storedModels,
        selectedModelId,
        selectModel,
        saveCurrentModel,
        getSelectedModelInfo,
        loadModel
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModelTrainingContext = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelTrainingContext must be used within a ModelProvider');
  }
  return context;
};