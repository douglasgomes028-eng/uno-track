import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Fuel, Navigation, Clock, Trash2 } from 'lucide-react';
import { getTrips, getTotalKm, getLastKm, clearAllData } from '@/utils/storage';
import { Trip } from '@/types/tracking';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export function TripHistory() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalKm, setTotalKm] = useState(0);
  const [lastKm, setLastKm] = useState(0);

  const loadData = () => {
    setTrips(getTrips());
    setTotalKm(getTotalKm());
    setLastKm(getLastKm());
  };

  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleClearData = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      clearAllData();
      loadData();
      toast({
        title: "Histórico limpo!",
        description: "Todos os dados foram removidos.",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Percursos
          </CardTitle>
          {trips.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum percurso registrado ainda.</p>
            <p className="text-sm">Inicie seu primeiro tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <div className="text-2xl font-bold text-primary">{lastKm.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Último KM</div>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-lg border-2 border-success/20">
                <div className="text-2xl font-bold text-success">
                  {trips.reduce((sum, trip) => sum + trip.kmTraveled, 0).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Percorrido</div>
              </div>
              <div className="text-center p-4 bg-warning/5 rounded-lg border-2 border-warning/20">
                <div className="text-2xl font-bold text-warning">
                  {trips.reduce((sum, trip) => sum + trip.fuelConsumed, 0).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">Combustível Total</div>
              </div>
            </div>

            {/* Trip List */}
            <div className="space-y-3">
              {trips.slice().reverse().map((trip, index) => (
                <div key={trip.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {index === 0 ? "Último percurso" : `Percurso ${trips.length - index}`}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(trip.endTime)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-primary" />
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
}