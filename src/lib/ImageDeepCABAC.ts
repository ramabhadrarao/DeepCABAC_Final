import * as tf from '@tensorflow/tfjs';

export class ImageDeepCABAC {
  private contexts: Map<string, { frequency: number }>;
  private options: {
    blockSize: number;
    quantizationLevel: number;
    colorSpace: 'RGB' | 'YCbCr';
  };

  constructor(options: Partial<typeof ImageDeepCABAC.prototype.options> = {}) {
    this.contexts = new Map();
    this.options = {
      blockSize: options.blockSize || 8,
      quantizationLevel: options.quantizationLevel || 8,
      colorSpace: options.colorSpace || 'YCbCr'
    };
  }

  async loadImage(imageData: ImageData): Promise<tf.Tensor3D> {
    return tf.browser.fromPixels(imageData);
  }

  rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return [y, cb, cr];
  }

  createImageBlocks(tensor: tf.Tensor3D): tf.Tensor4D {
    const [height, width, channels] = tensor.shape;
    const blockSize = this.options.blockSize;
    const paddedHeight = Math.ceil(height / blockSize) * blockSize;
    const paddedWidth = Math.ceil(width / blockSize) * blockSize;
    
    // Pad the image if necessary
    const padded = tf.pad(tensor, [
      [0, paddedHeight - height],
      [0, paddedWidth - width],
      [0, 0]
    ]);
    
    // Reshape into blocks
    return tf.reshape(padded, [
      -1,
      blockSize,
      blockSize,
      channels
    ]);
  }

  quantizeBlock(block: tf.Tensor4D): tf.Tensor4D {
    const step = 256 / this.options.quantizationLevel;
    return tf.mul(tf.floor(tf.div(block, step)), step);
  }

  async compress(imageData: ImageData) {
    const tensor = await this.loadImage(imageData);
    const blocks = this.createImageBlocks(tensor);
    const quantized = this.quantizeBlock(blocks);
    
    // Convert to YCbCr if specified
    let processed = quantized;
    if (this.options.colorSpace === 'YCbCr') {
      processed = tf.tidy(() => {
        const rgb = tf.split(quantized, 3, -1);
        const converted = tf.stack(rgb.map((channel, i) => {
          const others = rgb.filter((_, j) => j !== i);
          return tf.add(
            tf.mul(channel, i === 0 ? 0.299 : i === 1 ? -0.168736 : 0.5),
            tf.add(
              tf.mul(others[0], i === 0 ? 0.587 : i === 1 ? -0.331264 : -0.418688),
              tf.mul(others[1], i === 0 ? 0.114 : i === 1 ? 0.5 : -0.081312)
            )
          );
        }), -1);
        return converted;
      });
    }

    // Compress using arithmetic coding
    const compressedData = await this.compressBlocks(processed);

    // Cleanup
    tensor.dispose();
    blocks.dispose();
    quantized.dispose();
    if (processed !== quantized) {
      processed.dispose();
    }

    return {
      compressed: compressedData,
      metadata: {
        width: imageData.width,
        height: imageData.height,
        colorSpace: this.options.colorSpace,
        blockSize: this.options.blockSize,
        quantizationLevel: this.options.quantizationLevel
      }
    };
  }

  private async compressBlocks(blocks: tf.Tensor4D): Promise<number[][]> {
    const compressed: number[][] = [];
    const blockData = await blocks.array();

    for (const block of blockData) {
      const flatBlock = block.flat(3);
      compressed.push(this.compressBlock(flatBlock));
    }

    return compressed;
  }

  private compressBlock(block: number[]): number[] {
    const compressed: number[] = [];
    let low = 0;
    let high = 1;
    
    for (let i = 0; i < block.length; i++) {
      const context = this.getBlockContext(block, i);
      const value = block[i];
      
      const range = high - low;
      const probability = this.getProbability(value, context);
      
      high = low + range * probability.high;
      low = low + range * probability.low;
      
      while ((high < 0.5 && low < 0.5) || (high >= 0.5 && low >= 0.5)) {
        const bit = high < 0.5 ? 0 : 1;
        compressed.push(bit);
        low = (low * 2) % 1;
        high = (high * 2) % 1;
      }
    }
    
    return compressed;
  }

  private getBlockContext(block: number[], index: number): string {
    const contextSize = 4;
    const context = [];
    
    for (let i = Math.max(0, index - contextSize); i < index; i++) {
      context.push(block[i]);
    }
    
    return context.join('|');
  }

  private getProbability(value: number, context: string): { low: number; high: number } {
    const contextKey = `${context}_${value}`;
    const frequency = this.contexts.get(contextKey)?.frequency || 0;
    const total = Array.from(this.contexts.values())
      .reduce((sum, ctx) => sum + ctx.frequency, 0);
    
    return {
      low: frequency / (total + 1),
      high: (frequency + 1) / (total + 1)
    };
  }
}