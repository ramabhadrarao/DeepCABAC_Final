import React from 'react';
import { Brain, Zap, Activity, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const modules = [
    ...(isAdmin
      ? [
          {
            name: 'Model Training',
            icon: <Brain className="h-8 w-8 text-blue-600" />,
            description: 'Train neural network models with different datasets',
            path: '/model-training',
            color: 'bg-blue-50',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
          },
        ]
      : []),
    {
      name: 'Image Compression',
      icon: <Upload className="h-8 w-8 text-indigo-600" />,
      description: 'Compress images using DeepCABAC algorithm',
      path: '/image-compression',
      color: 'bg-indigo-50',
      textColor: 'text-indigo-800',
      borderColor: 'border-indigo-200',
    },
    {
      name: 'Model Compression',
      icon: <Zap className="h-8 w-8 text-green-600" />,
      description: 'Compress neural network models with pruning and quantization',
      path: '/model-compression',
      color: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    {
      name: 'Model Evaluation',
      icon: <Activity className="h-8 w-8 text-purple-600" />,
      description: 'Evaluate model performance after compression',
      path: '/model-evaluation',
      color: 'bg-purple-50',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.username}!
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Neural Network & Image Compression Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            to={module.path}
            className={`${module.color} border ${module.borderColor} rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-4 mb-4">
              {module.icon}
              <h2 className={`text-xl font-semibold ${module.textColor}`}>
                {module.name}
              </h2>
            </div>
            <p className="text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;