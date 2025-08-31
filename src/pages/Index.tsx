import React, { Suspense, useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import KmTracker from '@/components/KmTracker';
import MapSection from '@/components/MapSection';
import StatsSection from '@/components/StatsSection';
import TripHistory from '@/components/TripHistory';
import MaintenanceSection from '@/components/MaintenanceSection';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { TrackingState } from '@/types/tracking';

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
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    currentTrip: null,
    startKm: 0,
    currentLocation: null,
    totalDistance: 0,
    plannedRoute: null,
    destination: null,
    routePlanning: false
  });

  // Listen for tracking state changes from KmTracker
  useEffect(() => {
    const handleTrackingUpdate = (event: CustomEvent) => {
      setTrackingState(event.detail);
    };

    window.addEventListener('tracking-state-updated', handleTrackingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tracking-state-updated', handleTrackingUpdate as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Main Layout Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <Suspense fallback={<div className="text-center p-4">Carregando...</div>}>
              <ErrorFallback componentName="KmTracker">
                <KmTracker />
              </ErrorFallback>
              
              <ErrorFallback componentName="MapSection">
                <MapSection 
                  currentLocation={trackingState.currentLocation}
                  locations={trackingState.currentTrip?.locations || []}
                  plannedRoute={trackingState.plannedRoute}
                  destination={trackingState.destination}
                />
              </ErrorFallback>
              
              <ErrorFallback componentName="StatsSection">
                <StatsSection />
              </ErrorFallback>
            </Suspense>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1 xl:col-span-1 space-y-6">
            <Suspense fallback={<div className="text-center p-4">Carregando...</div>}>
              <ErrorFallback componentName="TripHistory">
                <TripHistory />
              </ErrorFallback>
              
              <ErrorFallback componentName="MaintenanceSection">
                <MaintenanceSection />
              </ErrorFallback>
            </Suspense>
          </div>
        </div>
        
        <Suspense fallback={<div className="text-center p-4">Carregando...</div>}>
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