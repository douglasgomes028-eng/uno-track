import React, { Suspense } from 'react';
import KmTracker from '@/components/KmTracker';
import TripHistory from '@/components/TripHistory';
import MaintenanceSection from '@/components/MaintenanceSection';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// Error boundary component
const ErrorFallback = ({ children, componentName }: { children: React.ReactNode, componentName: string }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Erro no componente ${componentName}:`, error);
    return null;
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Uno Track</h1>
          <p className="text-muted-foreground">Controle de quilometragem - Fiat Uno 1991</p>
        </div>
        
        <Suspense fallback={<div className="text-center p-4">Carregando...</div>}>
          <ErrorFallback componentName="KmTracker">
            <KmTracker />
          </ErrorFallback>
          
          <ErrorFallback componentName="TripHistory">
            <TripHistory />
          </ErrorFallback>
          
          <ErrorFallback componentName="MaintenanceSection">
            <MaintenanceSection />
          </ErrorFallback>
          
          <ErrorFallback componentName="PWAInstallPrompt">
            <PWAInstallPrompt />
          </ErrorFallback>
        </Suspense>
        
        <footer className="text-center text-sm text-muted-foreground py-4">
          <p>Uno Track - Desenvolvido para o clássico Fiat Uno 1991</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;