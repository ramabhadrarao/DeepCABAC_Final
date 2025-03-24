import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModelTraining from './pages/ModelTraining'; // Use the dedicated ModelTraining component
import ImageCompression from './pages/ImageCompression';
import ModelCompression from './pages/ModelCompression';
import ModelEvaluation from './pages/ModelEvaluation';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ModelProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/model-training"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <ModelTraining />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/image-compression"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageCompression />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/model-compression"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ModelCompression />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/model-evaluation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ModelEvaluation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ModelProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);