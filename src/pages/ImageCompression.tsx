import React from 'react';
import { ImageCompressor } from '../components/ImageCompressor';

const ImageCompression: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Compression</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Compress images using the DeepCABAC neural compression algorithm
        </p>
      </div>
      
      <ImageCompressor />
    </div>
  );
};

export default ImageCompression;