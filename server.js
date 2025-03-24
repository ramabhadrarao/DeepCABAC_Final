import express from 'express';
import multer from 'multer';
import * as tf from '@tensorflow/tfjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('dist'));

// Store model in memory
let model = null;
let trainingHistory = [];

app.post('/api/train', upload.single('model'), async (req, res) => {
  try {
    // Create a simple model for demonstration
    model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Generate some dummy data for training
    const xs = tf.randomNormal([100, 10]);
    const ys = tf.randomUniform([100, 1]);

    // Train the model
    const history = await model.fit(xs, ys, {
      epochs: 10,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          trainingHistory.push({
            epoch: epoch + 1,
            loss: logs.loss,
            accuracy: logs.acc
          });
        }
      }
    });

    res.json({ 
      message: 'Model trained successfully',
      history: trainingHistory
    });
  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({ error: 'Training failed' });
  }
});

app.post('/api/compress', async (req, res) => {
  try {
    if (!model) {
      throw new Error('No model available');
    }

    const { pruningRate, bits } = req.body;

    // Get model size before compression
    const originalSize = await model.save('file://temp').then(info => {
      return info.weightData.byteLength;
    });

    // Simulate compression (in a real app, you'd use proper quantization)
    const compressedSize = originalSize * (1 - pruningRate);

    // Generate layer metrics
    const layerMetrics = model.layers.map((layer, index) => ({
      name: `Layer${index + 1}`,
      parameters: layer.countParams(),
      compression: Math.random() * 0.3 + 0.5 // Random compression rate between 0.5 and 0.8
    }));

    res.json({
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      pruningRate,
      quantizationBits: bits,
      layerMetrics
    });
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ error: 'Compression failed' });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    if (!model) {
      throw new Error('No model available');
    }

    // Generate test data
    const xs = tf.randomNormal([50, 10]);
    const ys = tf.randomUniform([50, 1]);

    // Evaluate model
    const evaluation = await model.evaluate(xs, ys);
    const accuracy = evaluation[1].dataSync()[0];

    res.json({ accuracy });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});