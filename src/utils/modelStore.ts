import * as tf from '@tensorflow/tfjs';
import { DatasetType } from '../hooks/useModelTraining';

// Interface for model metadata
export interface StoredModel {
  id: string;
  name: string;
  dataset: DatasetType;
  accuracy: number;
  createdAt: string;
  parameters: number;
}

// In-memory model and data store
const store = {
  currentModel: null as tf.LayersModel | null,
  storedModels: [] as StoredModel[],
  // Keep a reference to test data
  testData: null as { xs: tf.Tensor, ys: tf.Tensor } | null
};

// Event listeners for model changes
const listeners: (() => void)[] = [];

// Simple function to notify listeners of changes
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Get the current model
export const getCurrentModel = (): tf.LayersModel | null => {
  return store.currentModel;
};

// Get stored test data
export const getTestData = () => {
  return store.testData;
};

// Set test data
export const setTestData = (data: { xs: tf.Tensor, ys: tf.Tensor }) => {
  // Dispose old test data if it exists
  if (store.testData) {
    store.testData.xs.dispose();
    store.testData.ys.dispose();
  }
  store.testData = data;
};

// Set the current model and update metadata
export const setCurrentModel = (
  model: tf.LayersModel,
  metadata: Omit<StoredModel, 'id' | 'createdAt'>
): void => {
  // Store the model - important: don't dispose old models here to prevent layer disposal
  store.currentModel = model;
  
  // Create a stored model record
  const modelInfo: StoredModel = {
    id: `model_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...metadata,
  };
  
  // Add to stored models (at the beginning for newest first)
  store.storedModels = [modelInfo, ...store.storedModels];
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem('storedModels', JSON.stringify(store.storedModels));
  } catch (err) {
    console.error('Failed to save model metadata to localStorage', err);
  }
  
  // Notify listeners of the change
  notifyListeners();
};

// Get all stored model metadata
export const getStoredModels = (): StoredModel[] => {
  return store.storedModels;
};

// Get specific model by ID
export const getModelById = (id: string): StoredModel | undefined => {
  return store.storedModels.find(model => model.id === id);
};

// Load stored models from localStorage on startup
export const initializeModelStore = (): void => {
  try {
    const saved = localStorage.getItem('storedModels');
    if (saved) {
      store.storedModels = JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load stored models from localStorage', err);
  }
};

// Subscribe to model changes
export const subscribeToModelChanges = (callback: () => void): () => void => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

// Initialize on import
initializeModelStore();