import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Play, Square, MapPin, MapPinOff, Fuel, Gauge, Clock, Navigation, Route as RouteIcon } from 'lucide-react';
import { TrackingState, Location, Route } from '@/types/tracking';
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
    totalDistance: 0,
    plannedRoute: null,
    destination: null,
    routePlanning: false
  });
  const [positionWatcher, setPositionWatcher] = useState<number | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  
  const FUEL_EFFICIENCY = 0.1; // 10km/L = 0.1L/km

  const calculateRoute = async (origin: Location, destination: Location, token: string): Promise<Route | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${token}`
      );

      if (!response.ok) throw new Error('Erro ao calcular rota');

      const data = await response.json();
      const route = data.routes[0];

      if (!route) throw new Error('Nenhuma rota encontrada');

      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance / 1000, // Converter metros para km
        duration: route.duration / 60, // Converter segundos para minutos
        geometry: JSON.stringify(route.geometry)
      };
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      return null;
    }
  };

  const geocodeAddress = async (address: string, token: string): Promise<Location | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=BR&limit=1`
      );

      if (!response.ok) throw new Error('Erro na busca do endereço');

      const data = await response.json();
      const feature = data.features[0];

      if (!feature) throw new Error('Endereço não encontrado');

      return {
        lat: feature.center[1],
        lng: feature.center[0],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return null;
    }
  };

  const planRoute = async () => {
    if (!destinationAddress.trim()) {
      toast({
        title: "Erro",
        description: "Insira um destino para planejar a rota.",
        variant: "destructive"
      });
      return;
    }

    setTrackingState(prev => ({ ...prev, routePlanning: true }));

    try {
      const hasLocation = await requestLocationPermission();
      if (!hasLocation) {
        setTrackingState(prev => ({ ...prev, routePlanning: false }));
        return;
      }

      const currentLocation = await getCurrentLocation();
      const mapboxToken = localStorage.getItem('mapbox_token');

      if (!mapboxToken) {
        toast({
          title: "Token necessário",
          description: "Configure o token do Mapbox para usar o planejamento de rotas.",
          variant: "destructive"
        });
        setTrackingState(prev => ({ ...prev, routePlanning: false }));
        return;
      }

      const destination = await geocodeAddress(destinationAddress, mapboxToken);
      if (!destination) {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar o endereço especificado.",
          variant: "destructive"
        });
        setTrackingState(prev => ({ ...prev, routePlanning: false }));
        return;
      }

      const route = await calculateRoute(currentLocation, destination, mapboxToken);
      if (!route) {
        toast({
          title: "Erro",
          description: "Não foi possível calcular a rota.",
          variant: "destructive"
        });
        setTrackingState(prev => ({ ...prev, routePlanning: false }));
        return;
      }

      setTrackingState(prev => ({
        ...prev,
        currentLocation,
        destination,
        plannedRoute: route,
        routePlanning: false
      }));

      toast({
        title: "Rota calculada!",
        description: `Distância: ${route.distance.toFixed(1)}km, Tempo estimado: ${Math.round(route.duration)}min`
      });

    } catch (error) {
      toast({
        title: "Erro ao planejar rota",
        description: "Tente novamente.",
        variant: "destructive"
      });
      setTrackingState(prev => ({ ...prev, routePlanning: false }));
    }
  };

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
      totalDistance: 0,
      plannedRoute: trackingState.plannedRoute,
      destination: trackingState.destination,
      routePlanning: false
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
        plannedRoute: null,
        destination: null,
        routePlanning: false
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
        {!trackingState.isTracking && !trackingState.plannedRoute ? (
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
            
            <div>
              <Label htmlFor="destination" className="text-sm font-medium mb-2 block">
                Destino (opcional - para planejamento de rota)
              </Label>
              <Input
                id="destination"
                type="text"
                placeholder="Ex: Rua das Flores, 123, São Paulo"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="flex gap-2">
              {destinationAddress.trim() && (
                <Button 
                  onClick={planRoute}
                  disabled={trackingState.routePlanning}
                  variant="outline"
                  className="flex-1"
                >
                  <RouteIcon className="mr-2 h-4 w-4" />
                  {trackingState.routePlanning ? "Calculando..." : "Planejar Rota"}
                </Button>
              )}
              <Button 
                onClick={startTracking} 
                className="flex-1 bg-primary hover:bg-primary/90" 
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                {destinationAddress.trim() ? "Iniciar sem Rota" : "Iniciar Tracking"}
              </Button>
            </div>
          </div>
        ) : !trackingState.isTracking && trackingState.plannedRoute ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm text-primary mb-2">Rota Planejada</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Distância:</span>
                  <div className="font-medium">{trackingState.plannedRoute.distance.toFixed(1)} km</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <div className="font-medium">{Math.round(trackingState.plannedRoute.duration)} min</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Combustível estimado:</span>
                  <div className="font-medium text-success">{(trackingState.plannedRoute.distance * FUEL_EFFICIENCY).toFixed(2)}L</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Destino:</span>
                  <div className="font-medium truncate">{destinationAddress}</div>
                </div>
              </div>
            </div>

            {/* Map with planned route */}
            {trackingState.currentLocation && (
              <MapComponent 
                currentLocation={trackingState.currentLocation}
                locations={[]}
                plannedRoute={trackingState.plannedRoute}
                destination={trackingState.destination}
              />
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => setTrackingState(prev => ({ 
                  ...prev, 
                  plannedRoute: null, 
                  destination: null 
                }))}
                variant="outline"
                className="flex-1"
              >
                Nova Rota
              </Button>
              <Button 
                onClick={startTracking} 
                className="flex-1 bg-primary hover:bg-primary/90" 
                size="lg"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Iniciar Navegação
              </Button>
            </div>
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
                plannedRoute={trackingState.plannedRoute}
                destination={trackingState.destination}
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