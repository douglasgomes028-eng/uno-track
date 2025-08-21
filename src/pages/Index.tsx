import { Header } from '@/components/Header';
import { KmTracker } from '@/components/KmTracker';
import { TripHistory } from '@/components/TripHistory';
import { MaintenanceSection } from '@/components/MaintenanceSection';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <KmTracker />
        <TripHistory />
        <MaintenanceSection />
      </main>

      <PWAInstallPrompt />
      
      <footer className="mt-12 py-6 text-center text-sm text-muted-foreground border-t">
        <p>Uno Track © 2024 - Desenvolvido para Fiat Uno 1991 Motor Fiasa 1.0</p>
        <p className="mt-1">Consumo base: 10 km/L (cidade)</p>
      </footer>
    </div>
  );
};

export default Index;