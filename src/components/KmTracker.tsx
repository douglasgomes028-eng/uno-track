import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, MapPin, Fuel, Clock, Gauge } from 'lucide-react';
import { Location, Trip, TrackingState } from '@/types/tracking';
import { getCurrentLocation, watchPosition, calculateDistance } from '@/utils/geolocation';
import { saveTrip, getLastKm } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

export function KmTracker() {
  const { toast } = useToast();
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    currentTrip: null,
    startKm: getLastKm(),
    currentLocation: null,
    totalDistance: 0
  });
  
  const [startKmInput, setStartKmInput] = useState(getLastKm().toString());
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<Location | null>(null);

  const requestLocationPermission = async () => {
    try {
      const location = await getCurrentLocation();
      setTrackingState(prev => ({ ...prev, currentLocation: location }));
      toast({
        title: "GPS conectado!",
        description: "Localização obtida com sucesso.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro no GPS",
        description: "Não foi possível acessar sua localização. Verifique as permissões.",
        variant: "destructive"
      });
      return false;
    }
  };

  const startTracking = async () => {
    const startKm = parseInt(startKmInput);
    if (isNaN(startKm) || startKm < 0) {
      toast({
        title: "KM inválido",
        description: "Por favor, insira um valor válido para o KM inicial.",
        variant: "destructive"
      });
      return;
    }

    const hasLocation = await requestLocationPermission();
    if (!hasLocation) return;

    const currentLocation = await getCurrentLocation();
    lastLocationRef.current = currentLocation;

    const newTrip: Partial<Trip> = {
      id: `trip-${Date.now()}`,
      startKm,
      startTime: new Date(),
      locations: [currentLocation]
    };

    setTrackingState({
      isTracking: true,
      currentTrip: newTrip,
      startKm,
      currentLocation,
      totalDistance: 0
    });

    // Start watching position
    watchIdRef.current = watchPosition((location) => {
      setTrackingState(prev => {
        const lastLoc = lastLocationRef.current;
        let newDistance = prev.totalDistance;
        
        if (lastLoc) {
          const distance = calculateDistance(lastLoc, location);
          newDistance += distance;
        }
        
        lastLocationRef.current = location;
        
        return {
          ...prev,
          currentLocation: location,
          totalDistance: newDistance,
          currentTrip: prev.currentTrip ? {
            ...prev.currentTrip,
            locations: [...(prev.currentTrip.locations || []), location]
          } : null
        };
      });
    });

    toast({
      title: "Tracking iniciado!",
      description: "Começando a monitorar sua viagem.",
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!trackingState.currentTrip) return;

    const endKm = trackingState.startKm + trackingState.totalDistance;
    const fuelConsumed = trackingState.totalDistance / 10; // 10 km/L
    const averageConsumption = trackingState.totalDistance / fuelConsumed;

    const completedTrip: Trip = {
      ...trackingState.currentTrip as Trip,
      endKm,
      kmTraveled: trackingState.totalDistance,
      fuelConsumed,
      averageConsumption,
      endTime: new Date()
    };

    saveTrip(completedTrip);
    
    setTrackingState({
      isTracking: false,
      currentTrip: null,
      startKm: endKm,
      currentLocation: null,
      totalDistance: 0
    });

    setStartKmInput(endKm.toFixed(1));
    lastLocationRef.current = null;

    toast({
      title: "Viagem finalizada!",
      description: `Percurso de ${trackingState.totalDistance.toFixed(2)} km registrado.`,
    });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <Card className="shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          Controle de Quilometragem
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!trackingState.isTracking ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                KM inicial do carro
              </label>
              <Input
                type="number"
                placeholder="Ex: 150000"
                value={startKmInput}
                onChange={(e) => setStartKmInput(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={startTracking} 
              variant="automotive"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Tracking
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {trackingState.totalDistance.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">KM Percorridos</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {(trackingState.totalDistance / 10).toFixed(2)}L
                </div>
                <div className="text-xs text-muted-foreground">Combustível</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 bg-gradient-eco/10 rounded-lg">
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" />
                GPS Ativo
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                Em andamento
              </Badge>
            </div>

            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Square className="w-4 h-4 mr-2" />
              Finalizar Percurso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}