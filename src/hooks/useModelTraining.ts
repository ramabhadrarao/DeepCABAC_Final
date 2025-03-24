import { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

interface TrainingProgress {
  epoch: number;
  loss: number;
  accuracy: number;
}

export type DatasetType = 'mnist' | 'cifar10' | 'synthetic';

interface DatasetInfo {
  name: string;
  description: string;
  imageSize: [number, number, number]; // [height, width, channels]
  numClasses: number;
  expectedAccuracy: string;
}

export const DATASETS: Record<DatasetType, DatasetInfo> = {
  mnist: {
    name: 'MNIST Handwritten Digits',
    description: 'Classic dataset of handwritten digits (0-9)',
    imageSize: [28, 28, 1],
    numClasses: 10,
    expectedAccuracy: '98-99%'
  },
  cifar10: {
    name: 'CIFAR-10',
    description: '60,000 32x32 color images in 10 classes',
    imageSize: [32, 32, 3],
    numClasses: 10,
    expectedAccuracy: '70-90%'
  },
  synthetic: {
    name: 'Synthetic Patterns',
    description: 'Generated patterns for testing',
    imageSize: [28, 28, 1],
    numClasses: 10,
    expectedAccuracy: '85-95%'
  }
};

const useModelTraining = () => {
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetLoadingProgress, setDatasetLoadingProgress] = useState(0);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const trainingDataRef = useRef<{ xs: tf.Tensor; ys: tf.Tensor } | null>(null);
  const testDataRef = useRef<{ xs: tf.Tensor; ys: tf.Tensor } | null>(null);

  const cleanupTensors = () => {
    if (trainingDataRef.current) {
      trainingDataRef.current.xs.dispose();
      trainingDataRef.current.ys.dispose();
      trainingDataRef.current = null;
    }
    if (testDataRef.current) {
      testDataRef.current.xs.dispose();
      testDataRef.current.ys.dispose();
      testDataRef.current = null;
    }
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }
  };

  const normalizeData = (data: tf.Tensor) => {
    return tf.tidy(() => {
      const normalized = tf.div(data, 255.0);
      return normalized;
    });
  };

  const createModel = (datasetType: DatasetType): tf.LayersModel => {
    try {
      cleanupTensors();

      const dataset = DATASETS[datasetType];
      const [height, width, channels] = dataset.imageSize;

      const model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [height, width, channels],
            kernelSize: 3,
            filters: 32,
            padding: 'same',
            activation: 'relu',
            kernelInitializer: 'glorotNormal'
          }),
          tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
          tf.layers.conv2d({
            kernelSize: 3,
            filters: 64,
            padding: 'same',
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
          tf.layers.conv2d({
            kernelSize: 3,
            filters: 64,
            padding: 'same',
            activation: 'relu'
          }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.5 }),
          tf.layers.dense({
            units: dataset.numClasses,
            activation: 'softmax'
          })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      modelRef.current = model;
      return model;
    } catch (err) {
      cleanupTensors();
      throw new Error(`Failed to create model: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const loadMNIST = async () => {
    setIsLoadingDataset(true);
    setDatasetLoadingProgress(0);
    
    try {
      setDatasetLoadingProgress(10);
      
      const numSamples = 5000;
      const patterns: number[][][][] = []; // [samples][height][width][channels]
      const labels: number[] = [];

      for (let i = 0; i < numSamples; i++) {
        setDatasetLoadingProgress(10 + Math.floor((i / numSamples) * 80));
        
        const digit = i % 10;
        labels.push(digit);

        // Create a 28x28x1 pattern for each digit
        const pattern: number[][][] = Array(28).fill(0).map(() => 
          Array(28).fill(0).map(() => [0]) // Initialize with single channel
        );
        
        // Draw digit-like patterns
        const centerX = 14;
        const centerY = 14;
        const radius = 8;

        for (let y = 0; y < 28; y++) {
          for (let x = 0; x < 28; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let value = 0;
            switch (digit) {
              case 0: // Circle
                value = distance < radius && distance > radius - 3 ? 1 : 0;
                break;
              case 1: // Vertical line
                value = Math.abs(x - centerX) < 2 ? 1 : 0;
                break;
              case 2: // Horizontal S shape
                value = (Math.abs(y - centerY + Math.sin(x / 5) * 5) < 2) ? 1 : 0;
                break;
              case 3: // Three horizontal lines
                value = y === centerY || y === centerY - 5 || y === centerY + 5 ? 1 : 0;
                break;
              case 4: // Cross
                value = (Math.abs(x - centerX) < 2 || Math.abs(y - centerY) < 2) ? 1 : 0;
                break;
              case 5: // Square
                value = (Math.abs(x - centerX) === radius || Math.abs(y - centerY) === radius) ? 1 : 0;
                break;
              case 6: // Diamond
                value = (Math.abs(x - centerX) + Math.abs(y - centerY)) === radius ? 1 : 0;
                break;
              case 7: // Diagonal line
                value = Math.abs(x - y) < 2 ? 1 : 0;
                break;
              case 8: // Double circle
                value = (distance < radius && distance > radius - 2) || 
                       (distance < radius/2 && distance > radius/2 - 2) ? 1 : 0;
                break;
              case 9: // Spiral
                const angle = Math.atan2(dy, dx);
                const targetRadius = (angle + Math.PI) * 3;
                value = Math.abs(distance - targetRadius) < 1 ? 1 : 0;
                break;
            }
            
            pattern[y][x][0] = value * 255; // Scale to 0-255 range for normalization
          }
        }
        
        patterns.push(pattern);
      }

      setDatasetLoadingProgress(90);

      const xs = tf.tensor4d(patterns, [numSamples, 28, 28, 1]);
      const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 10);

      setDatasetLoadingProgress(100);
      return { xs, ys };
    } catch (err) {
      throw new Error(`Failed to load MNIST dataset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  const loadCIFAR10 = async () => {
    setIsLoadingDataset(true);
    setDatasetLoadingProgress(0);
    
    try {
      const numSamples = 5000;
      const patterns: number[][][][] = []; // [samples][height][width][channels]
      const labels: number[] = [];

      for (let i = 0; i < numSamples; i++) {
        setDatasetLoadingProgress(Math.floor((i / numSamples) * 90));
        
        const classIndex = i % 10;
        labels.push(classIndex);

        // Create a 32x32x3 pattern
        const pattern: number[][][] = Array(32).fill(0).map(() => 
          Array(32).fill(0).map(() => [
            ((classIndex % 3 + 1) / 3) * 255, // R
            ((classIndex % 2 + 1) / 2) * 255, // G
            ((classIndex % 4 + 1) / 4) * 255  // B
          ])
        );

        // Add geometric patterns based on class
        const centerX = 16;
        const centerY = 16;
        const radius = 10;

        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let intensity = 0;
            switch (classIndex) {
              case 0: // Circle
                intensity = distance < radius && distance > radius - 3 ? 1 : 0;
                break;
              case 1: // Vertical stripes
                intensity = Math.sin(x * 0.5) > 0 ? 1 : 0;
                break;
              case 2: // Horizontal stripes
                intensity = Math.sin(y * 0.5) > 0 ? 1 : 0;
                break;
              case 3: // Diagonal pattern
                intensity = Math.sin((x + y) * 0.5) > 0 ? 1 : 0;
                break;
              case 4: // Checkerboard
                intensity = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 1 : 0;
                break;
              case 5: // Radial gradient
                intensity = 1 - (distance / radius);
                break;
              case 6: // Concentric circles
                intensity = Math.sin(distance * 0.5) > 0 ? 1 : 0;
                break;
              case 7: // Spiral
                const angle = Math.atan2(dy, dx);
                intensity = Math.sin(distance + angle * 3) > 0 ? 1 : 0;
                break;
              case 8: // Diamond
                intensity = (Math.abs(dx) + Math.abs(dy)) < radius ? 1 : 0;
                break;
              case 9: // Star
                const angleSteps = Math.floor((Math.atan2(dy, dx) + Math.PI) * 5 / Math.PI);
                intensity = angleSteps % 2 ? 1 : 0;
                break;
            }

            // Modify the base colors with the pattern
            pattern[y][x] = pattern[y][x].map(c => 
              Math.max(0, Math.min(255, c * (0.5 + intensity * 0.5)))
            );
          }
        }

        patterns.push(pattern);
      }

      setDatasetLoadingProgress(95);

      const xs = tf.tensor4d(patterns, [numSamples, 32, 32, 3]);
      const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 10);

      setDatasetLoadingProgress(100);
      return { xs, ys };
    } catch (err) {
      throw new Error(`Failed to load CIFAR-10 dataset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  const generateSyntheticData = (isColor = false) => {
    setIsLoadingDataset(true);
    setDatasetLoadingProgress(0);
    
    try {
      const numSamples = 5000;
      const patterns: number[][][][] = []; // [samples][height][width][channels]
      const labels: number[] = [];
      const channels = isColor ? 3 : 1;

      for (let i = 0; i < numSamples; i++) {
        const classIndex = i % 10;
        labels.push(classIndex);

        // Create a pattern with proper dimensions [height][width][channels]
        const pattern: number[][][] = Array(28).fill(0).map(() => 
          Array(28).fill(0).map(() => Array(channels).fill(0))
        );

        const centerX = 14;
        const centerY = 14;
        const radius = 8;

        for (let y = 0; y < 28; y++) {
          for (let x = 0; x < 28; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (isColor) {
              // Generate distinct color patterns for each class
              const baseColors = [
                ((classIndex % 3 + 1) / 3) * 255, // R
                ((classIndex % 2 + 1) / 2) * 255, // G
                ((classIndex % 4 + 1) / 4) * 255  // B
              ];

              let intensity = 0;
              switch (classIndex) {
                case 0: // Circle
                  intensity = distance < radius ? 1 : 0;
                  break;
                case 1: // Vertical stripes
                  intensity = Math.sin(x * 0.5) > 0 ? 1 : 0;
                  break;
                case 2: // Horizontal stripes
                  intensity = Math.sin(y * 0.5) > 0 ? 1 : 0;
                  break;
                case 3: // Diagonal pattern
                  intensity = Math.sin((x + y) * 0.5) > 0 ? 1 : 0;
                  break;
                case 4: // Checkerboard
                  intensity = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 1 : 0;
                  break;
                case 5: // Radial gradient
                  intensity = 1 - (distance / radius);
                  break;
                case 6: // Concentric circles
                  intensity = Math.sin(distance * 0.5) > 0 ? 1 : 0;
                  break;
                case 7: // Spiral
                  const angle = Math.atan2(dy, dx);
                  intensity = Math.sin(distance + angle * 3) > 0 ? 1 : 0;
                  break;
                case 8: // Diamond
                  intensity = (Math.abs(dx) + Math.abs(dy)) < radius ? 1 : 0;
                  break;
                case 9: // Star
                  const angleSteps = Math.floor((Math.atan2(dy, dx) + Math.PI) * 5 / Math.PI);
                  intensity = angleSteps % 2 ? 1 : 0;
                  break;
              }

              pattern[y][x] = baseColors.map(c => 
                Math.max(0, Math.min(255, c * (0.3 + intensity * 0.7)))
              );
            } else {
              // Generate grayscale patterns
              let value = 0;
              switch (classIndex) {
                case 0: // Circle
                  value = distance < radius && distance > radius - 2 ? 1 : 0;
                  break;
                case 1: // Vertical line
                  value = Math.abs(x - centerX) < 2 ? 1 : 0;
                  break;
                case 2: // Horizontal S shape
                  value = (Math.abs(y - centerY + Math.sin(x / 5) * 5) < 2) ? 1 : 0;
                  break;
                case 3: // Three horizontal lines
                  value = y === centerY || y === centerY - 5 || y === centerY + 5 ? 1 : 0;
                  break;
                case 4: // Cross
                  value = (Math.abs(x - centerX) < 2 || Math.abs(y - centerY) < 2) ? 1 : 0;
                  break;
                case 5: // Square
                  value = (Math.abs(x - centerX) === radius || Math.abs(y - centerY) === radius) ? 1 : 0;
                  break;
                case 6: // Diamond
                  value = (Math.abs(x - centerX) + Math.abs(y - centerY)) === radius ? 1 : 0;
                  break;
                case 7: // Diagonal line
                  value = Math.abs(x - y) < 2 ? 1 : 0;
                  break;
                case 8: // Double circle
                  value = (distance < radius && distance > radius - 2) || 
                         (distance < radius/2 && distance > radius/2 - 2) ? 1 : 0;
                  break;
                case 9: // Spiral
                  const angle = Math.atan2(dy, dx);
                  const targetRadius = (angle + Math.PI) * 3;
                  value = Math.abs(distance - targetRadius) < 1 ? 1 : 0;
                  break;
              }
              pattern[y][x][0] = value * 255;
            }
          }
        }
        
        patterns.push(pattern);

        if (i % 500 === 0) {
          setDatasetLoadingProgress(20 + Math.floor((i / numSamples) * 60));
        }
      }

      setDatasetLoadingProgress(80);

      const xs = tf.tensor4d(patterns, [numSamples, 28, 28, channels]);
      const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 10);

      setDatasetLoadingProgress(100);
      return { xs, ys };
    } catch (err) {
      throw new Error(`Failed to generate synthetic data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  const loadDataset = async (type: DatasetType) => {
    setIsLoadingDataset(true);
    setDatasetLoadingProgress(0);
    
    try {
      let data: { xs: tf.Tensor; ys: tf.Tensor };
      
      switch (type) {
        case 'mnist':
          data = await loadMNIST();
          break;
        case 'cifar10':
          data = await loadCIFAR10();
          break;
        case 'synthetic':
          data = generateSyntheticData(type === 'cifar10');
          break;
        default:
          throw new Error(`Unknown dataset type: ${type}`);
      }

      // Split data into training and test sets
      const numSamples = data.xs.shape[0];
      const testSize = Math.floor(numSamples * 0.2); // 20% for testing
      const trainSize = numSamples - testSize;

      const [trainXs, testXs] = tf.split(data.xs, [trainSize, testSize]);
      const [trainYs, testYs] = tf.split(data.ys, [trainSize, testSize]);

      // Normalize the data
      const normalizedTrainXs = normalizeData(trainXs);
      const normalizedTestXs = normalizeData(testXs);
      
      trainXs.dispose();
      testXs.dispose();
      data.xs.dispose();

      trainingDataRef.current = {
        xs: normalizedTrainXs,
        ys: trainYs
      };

      testDataRef.current = {
        xs: normalizedTestXs,
        ys: testYs
      };

      return trainingDataRef.current;
    } catch (err) {
      cleanupTensors();
      throw new Error(`Failed to load dataset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  const evaluateModel = async (datasetType: DatasetType): Promise<number> => {
    if (!modelRef.current) {
      throw new Error('No model available for evaluation');
    }

    if (!testDataRef.current) {
      // If no test data exists, generate new test data
      await loadDataset(datasetType);
    }

    if (!testDataRef.current) {
      throw new Error('Failed to load test data');
    }

    const result = await modelRef.current.evaluate(
      testDataRef.current.xs,
      testDataRef.current.ys,
      { batchSize: 32 }
    );

    // Get accuracy from evaluation result
    const accuracy = Array.isArray(result) ? result[1].dataSync()[0] : result.dataSync()[0];

    // Cleanup evaluation tensors
    if (Array.isArray(result)) {
      result.forEach(t => t.dispose());
    } else {
      result.dispose();
    }

    return accuracy;
  };

  const handleTrain = async (datasetType: DatasetType, epochs: number = 10) => {
    try {
      setIsTraining(true);
      setError(null);
      setTrainingProgress([]);
  
      const model = createModel(datasetType);
      const trainingData = await loadDataset(datasetType);
  
      if (!trainingData || !trainingData.xs.shape || trainingData.xs.shape[0] !== trainingData.ys.shape[0]) {
        throw new Error('Invalid data shapes');
      }
  
      await model.fit(trainingData.xs, trainingData.ys, {
        epochs: epochs, // Use the passed epochs parameter
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (!logs) return;
            
            setTrainingProgress(prev => [...prev, {
              epoch,
              loss: Number(logs.loss.toFixed(4)),
              accuracy: Number(logs.acc.toFixed(4))
            }]);
          },
          onBatchEnd: async () => {
            await tf.nextFrame(); // Prevent UI blocking
          }
        }
      });
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Training failed: ${errorMessage}`);
      console.error('Training error:', errorMessage);
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanupTensors();
    };
  }, []);

  return {
    handleTrain,
    isTraining,
    trainingProgress,
    error,
    model: modelRef.current,
    isLoadingDataset,
    datasetLoadingProgress,
    datasets: DATASETS,
    evaluateModel
  };
};

export default useModelTraining;