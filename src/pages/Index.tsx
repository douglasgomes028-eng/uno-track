import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { KmTracker } from '@/components/KmTracker';
import { TripHistory } from '@/components/TripHistory';
import { MaintenanceSection } from '@/components/MaintenanceSection';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {!user ? (
        <main className="container mx-auto px-4 py-6 text-center">
          <div className="max-w-md mx-auto bg-card rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Uno Track</h2>
            <p className="text-muted-foreground mb-6">
              Faça login para começar a rastrear suas viagens e acompanhar a manutenção do seu Fiat Uno 1991.
            </p>
            <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
          </div>
        </main>
      ) : (
        <main className="container mx-auto px-4 py-6 space-y-6">
          <KmTracker />
          <TripHistory />
          <MaintenanceSection />
        </main>
      )}

      <PWAInstallPrompt />
      
      <footer className="mt-12 py-6 text-center text-sm text-muted-foreground border-t">
        <p>Uno Track © 2024 - Desenvolvido para Fiat Uno 1991 Motor Fiasa 1.0</p>
        <p className="mt-1">Consumo base: 10 km/L (cidade)</p>
      </footer>
    </div>
  );
};

export default Index;