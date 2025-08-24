import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Play, Square, MapPin, MapPinOff, Fuel, Gauge, Clock } from 'lucide-react';
import { TrackingState, Location } from '@/types/tracking';
import { calculateDistance, getCurrentLocation, watchPosition } from '@/utils/geolocation';
import { saveTrip, getLastKm } from '@/utils/localStorageDB';
import { MapComponent } from './MapComponent';
import { Badge } from '@/components/ui/badge';

const KmTracker = () => {
  const { toast } = useToast();
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    currentTrip: null,
    startKm: 0,
    currentLocation: null,
    totalDistance: 0
  });
  const [positionWatcher, setPositionWatcher] = useState<number | null>(null);
  
  const FUEL_EFFICIENCY = 0.1; // 10km/L = 0.1L/km

  useEffect(() => {
    const loadLastKm = async () => {
      const lastKm = await getLastKm();
      setTrackingState(prev => ({ ...prev, startKm: lastKm }));
    };
    loadLastKm();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const location = await getCurrentLocation();
      setTrackingState(prev => ({ ...prev, currentLocation: location }));
      toast({
        title: "GPS conectado!",
        description: "Localização obtida com sucesso."
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
    const hasLocation = await requestLocationPermission();
    if (!hasLocation) return;

    const currentLocation = await getCurrentLocation();
    const startTime = new Date();

    const newTrip = {
      id: crypto.randomUUID(),
      startKm: trackingState.startKm,
      startTime,
      locations: [currentLocation]
    };

    setTrackingState({
      isTracking: true,
      currentTrip: newTrip,
      startKm: trackingState.startKm,
      currentLocation,
      totalDistance: 0
    });

    // Start watching position
    const watcherId = watchPosition((location) => {
      setTrackingState(prev => {
        if (!prev.currentTrip || !prev.currentLocation) return prev;

        const distance = calculateDistance(prev.currentLocation, location);
        const newDistance = prev.totalDistance + distance;

        return {
          ...prev,
          currentLocation: location,
          totalDistance: newDistance,
          currentTrip: {
            ...prev.currentTrip,
            locations: [...(prev.currentTrip.locations || []), location]
          }
        };
      });
    });

    setPositionWatcher(watcherId);

    toast({
      title: "Tracking iniciado!",
      description: "Começando a monitorar sua viagem."
    });
  };

  const stopTracking = async () => {
    if (!trackingState.isTracking || !trackingState.currentTrip || !trackingState.currentLocation) return;

    // Clear position watcher
    if (positionWatcher) {
      navigator.geolocation.clearWatch(positionWatcher);
      setPositionWatcher(null);
    }

    const endTime = new Date();
    const endKm = trackingState.startKm + trackingState.totalDistance;
    const fuelConsumed = trackingState.totalDistance * FUEL_EFFICIENCY; // L/100km
    const averageConsumption = fuelConsumed > 0 ? (fuelConsumed / trackingState.totalDistance) * 100 : 0;

    const completedTrip = {
      ...trackingState.currentTrip,
      id: crypto.randomUUID(),
      endKm,
      kmTraveled: trackingState.totalDistance,
      fuelConsumed,
      averageConsumption,
      endTime,
      locations: trackingState.currentTrip.locations || []
    };

    try {
      await saveTrip(completedTrip as any);
      
      toast({
        title: "Percurso finalizado!",
        description: `${trackingState.totalDistance.toFixed(1)}km percorridos. Combustível: ${fuelConsumed.toFixed(2)}L`,
      });

      // Reset tracking state
      setTrackingState({
        isTracking: false,
        currentTrip: null,
        startKm: endKm,
        currentLocation: null,
        totalDistance: 0,
      });

      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('trip-completed'));
    } catch (error) {
      toast({
        title: "Erro ao salvar percurso",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Cleanup position watcher on unmount
  useEffect(() => {
    return () => {
      if (positionWatcher) {
        navigator.geolocation.clearWatch(positionWatcher);
      }
    };
  }, [positionWatcher]);

  // Update locations array when current location changes
  useEffect(() => {
    if (trackingState.isTracking && trackingState.currentLocation && trackingState.currentTrip) {
      setTrackingState(prev => ({
        ...prev,
        currentTrip: prev.currentTrip ? {
          ...prev.currentTrip,
          locations: prev.currentTrip.locations || []
        } : null
      }));
    }
  }, [trackingState.currentLocation, trackingState.isTracking]);

  return (
    <Card className="w-full shadow-card-custom">
      <CardHeader className="bg-gradient-automotive text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Controle de Quilometragem
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!trackingState.isTracking ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="startKm" className="text-sm font-medium mb-2 block">
                KM inicial do carro
              </Label>
              <Input
                id="startKm"
                type="number"
                placeholder="Ex: 150000"
                value={trackingState.startKm}
                onChange={(e) => setTrackingState(prev => ({ 
                  ...prev, 
                  startKm: parseFloat(e.target.value) || 0 
                }))}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={startTracking} 
              className="w-full bg-primary hover:bg-primary/90" 
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar Tracking
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {trackingState.totalDistance.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">KM Percorridos</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {(trackingState.totalDistance * FUEL_EFFICIENCY).toFixed(2)}L
                </div>
                <div className="text-xs text-muted-foreground">Combustível</div>
              </div>
            </div>

            {/* Status badges */}
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

            {/* Map */}
            {trackingState.currentLocation && (
              <MapComponent 
                currentLocation={trackingState.currentLocation}
                locations={trackingState.currentTrip?.locations || []}
              />
            )}

            {/* Stop button */}
            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Square className="mr-2 h-4 w-4" />
              Finalizar Percurso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KmTracker;