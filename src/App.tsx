// src/App.tsx
import { Suspense } from 'react';
import { useAuth } from "@clerk/clerk-react";
import AppRoutes from "./Frontend/routes/Routes";
import ErrorBoundary from "./Frontend/components/Error/ErrorBoundary";

export default function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      }>
        <AppRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}
