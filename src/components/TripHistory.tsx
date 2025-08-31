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
      <CardHeader className="bg-gradient-subtle rounded-t-lg pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Histórico de Percursos
          </CardTitle>
          {trips.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="text-muted-foreground border-border hover:bg-muted hover:text-foreground h-7 w-7 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {trips.length === 0 ? (
          <div className="text-center py-6">
            <History className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">Nenhum percurso ainda.</p>
            <p className="text-xs text-muted-foreground">Inicie seu primeiro tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards - Simplified for sidebar */}
            <div className="grid grid-cols-1 gap-2">
              <div className="text-center p-2 bg-primary/10 rounded-md border border-primary/20">
                <div className="text-lg font-bold text-primary">{lastKm.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Último KM</div>
              </div>
            </div>

            {/* Trip List - Compact for sidebar */}
            <div className="space-y-2">
              {trips.slice(0, 3).map((trip, index) => (
                <div key={trip.id} className="p-2 border rounded-md hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-medium truncate flex-1">
                      {index === 0 ? "Casa → Mercado" : 
                       index === 1 ? "Trabalho → Academia" : 
                       "Centro → Casa"}
                    </div>
                    <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                      R$ {(trip.fuelConsumed * 5.5).toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {formatDate(trip.endTime).split(' ')[0]} • {trip.kmTraveled.toFixed(1)} km
                  </div>
                </div>
              ))}
              
              {trips.length > 3 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    +{trips.length - 3} mais percursos
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripHistory;