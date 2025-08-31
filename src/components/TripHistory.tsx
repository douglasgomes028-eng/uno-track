import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { History, Trash2, Route, Fuel, Gauge, Clock } from 'lucide-react';
import { Trip } from '@/types/tracking';
import { getTrips, getTotalKm, getLastKm, clearAllData } from '@/utils/localStorageDB';
import { Badge } from '@/components/ui/badge';

const TripHistory = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalKm, setTotalKm] = useState(0);
  const [lastKm, setLastKm] = useState(0);

  const loadData = async () => {
    try {
      const [tripsData, totalKmData, lastKmData] = await Promise.all([
        getTrips(),
        getTotalKm(),
        getLastKm()
      ]);
      
      setTrips(tripsData);
      setTotalKm(totalKmData);
      setLastKm(lastKmData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for storage changes and trip completion
    const handleStorageChange = () => {
      loadData();
    };

    const handleTripCompleted = () => {
      setTimeout(loadData, 100); // Small delay to ensure data is saved
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-updated', handleStorageChange);
    window.addEventListener('trip-completed', handleTripCompleted);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-updated', handleStorageChange);
      window.removeEventListener('trip-completed', handleTripCompleted);
    };
  }, []);

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      try {
        await clearAllData();
        await loadData();
        toast({
          title: "Histórico limpo!",
          description: "Todos os dados foram removidos.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível limpar os dados.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Percursos
          </CardTitle>
          {trips.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {trips.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">Nenhum percurso registrado ainda.</p>
            <p className="text-sm text-muted-foreground">Inicie seu primeiro tracking para ver o histórico aqui!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">{lastKm.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Último KM</div>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="text-2xl font-bold text-success">
                  {trips.reduce((sum, trip) => sum + trip.kmTraveled, 0).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Percorrido</div>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="text-2xl font-bold text-warning">
                  {trips.reduce((sum, trip) => sum + trip.fuelConsumed, 0).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">Combustível Total</div>
              </div>
            </div>

            {/* Trip List - mostrar em ordem cronológica correta */}
            <div className="space-y-3">
              {trips.map((trip, index) => (
                <div key={trip.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === trips.length - 1 ? "default" : "secondary"}>
                      {index === trips.length - 1 ? "Primeiro Registro" : 
                       index === 0 ? "Último percurso" : 
                       `Percurso ${trips.length - index}`}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(trip.endTime)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium">{trip.kmTraveled.toFixed(2)} km</div>
                        <div className="text-muted-foreground text-xs">Percorrido</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-success" />
                      <div>
                        <div className="font-medium">{trip.fuelConsumed.toFixed(2)}L</div>
                        <div className="text-muted-foreground text-xs">Consumido</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">{trip.startKm.toFixed(0)} → {trip.endKm.toFixed(0)}</div>
                      <div className="text-muted-foreground text-xs">KM inicial → final</div>
                    </div>
                    
                    <div>
                      <div className="font-medium">{trip.averageConsumption.toFixed(1)} km/L</div>
                      <div className="text-muted-foreground text-xs">Consumo médio</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripHistory;