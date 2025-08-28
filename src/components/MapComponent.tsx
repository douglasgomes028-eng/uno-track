import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location, Route } from '@/types/tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Map, Key } from 'lucide-react';

interface MapComponentProps {
  currentLocation: Location | null;
  locations: Location[];
  plannedRoute?: Route | null;
  destination?: Location | null;
}

export function MapComponent({ currentLocation, locations, plannedRoute, destination }: MapComponentProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const initializeMap = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: "Token inválido",
        description: "Por favor, insira um token válido do Mapbox.",
        variant: "destructive"
      });
      return;
    }

    // Store token for later use
    localStorage.setItem('mapbox_token', mapboxToken);
    mapboxgl.accessToken = mapboxToken;
    
    // Use setTimeout to ensure the container is ready
    setTimeout(() => {
      if (!mapContainer.current) {
        console.error('Container do mapa não está disponível');
        return;
      }

      const initialLocation = currentLocation || { lat: -15.7942, lng: -47.8822 }; // Brasília default

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12', // Melhor estilo similar ao Google Maps
          center: [initialLocation.lng, initialLocation.lat],
          zoom: 17, // Zoom mais próximo para melhor visualização
          pitch: 0, // Vista de cima como Google Maps
          bearing: 0
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true
          }),
          'top-right'
        );

        // Add geolocation control (botão para centralizar na localização atual)
        map.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          }),
          'top-right'
        );

        setShowTokenInput(false);
        
        toast({
          title: "Mapa inicializado!",
          description: "Token configurado com sucesso.",
        });
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        toast({
          title: "Erro na inicialização",
          description: "Verifique se o token está correto e tente novamente.",
          variant: "destructive"
        });
      }
    }, 100);
  };

  // Check if token exists in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setShowTokenInput(false);
      // Auto-initialize if we have current location
      if (currentLocation) {
        setTimeout(() => {
          mapboxgl.accessToken = savedToken;
          
          const initialLocation = currentLocation || { lat: -15.7942, lng: -47.8822 };

          if (mapContainer.current && !map.current) {
            map.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [initialLocation.lng, initialLocation.lat],
              zoom: 17,
              pitch: 0,
              bearing: 0
            });

            // Add navigation controls
            map.current.addControl(
              new mapboxgl.NavigationControl({
                visualizePitch: true,
                showZoom: true,
                showCompass: true
              }),
              'top-right'
            );

            // Add geolocation control
            map.current.addControl(
              new mapboxgl.GeolocateControl({
                positionOptions: {
                  enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
              }),
              'top-right'
            );
          }
        }, 100);
      }
    }
  }, [currentLocation]);

  useEffect(() => {
    if (map.current && currentLocation) {
      // Remove previous marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Create custom marker element (similar to Google Maps blue dot)
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background-color: #4285F4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(66, 133, 244, 0.5);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -10px;
            left: -10px;
            width: 40px;
            height: 40px;
            background-color: rgba(66, 133, 244, 0.2);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
      `;

      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(0.8); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      // Add current location marker with custom element
      markerRef.current = new mapboxgl.Marker(markerElement)
        .setLngLat([currentLocation.lng, currentLocation.lat])
        .addTo(map.current);

      // Center map on current location with smooth animation
      map.current.easeTo({
        center: [currentLocation.lng, currentLocation.lat],
        duration: 1000,
        zoom: 17
      });

      // Add destination marker if available
      if (destination && plannedRoute) {
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.remove();
        }

        const destinationElement = document.createElement('div');
        destinationElement.innerHTML = `
          <div style="
            width: 30px;
            height: 40px;
            background-color: #EA4335;
            border: 2px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            position: relative;
            box-shadow: 0 2px 10px rgba(234, 67, 53, 0.5);
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `;

        destinationMarkerRef.current = new mapboxgl.Marker(destinationElement)
          .setLngLat([destination.lng, destination.lat])
          .addTo(map.current);
      }

      // Draw planned route if available
      if (plannedRoute && plannedRoute.coordinates.length > 0) {
        if (map.current.getSource('planned-route')) {
          (map.current.getSource('planned-route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: plannedRoute.coordinates
            }
          });
        } else {
          map.current.addSource('planned-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: plannedRoute.coordinates
              }
            }
          });

          map.current.addLayer({
            id: 'planned-route',
            type: 'line',
            source: 'planned-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#1E90FF',
              'line-width': 4,
              'line-opacity': 0.7
            }
          });
        }

        // Fit map to show the entire route
        const bounds = new mapboxgl.LngLatBounds();
        plannedRoute.coordinates.forEach(coord => bounds.extend(coord));
        map.current.fitBounds(bounds, { padding: 50 });
      }

      // Draw travel path if we have multiple locations
      if (locations.length > 1) {
        const coordinates = locations.map(loc => [loc.lng, loc.lat]);
        
        if (map.current.getSource('travel-route')) {
          (map.current.getSource('travel-route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        } else {
          map.current.addSource('travel-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            }
          });

          map.current.addLayer({
            id: 'travel-route',
            type: 'line',
            source: 'travel-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF4444',
              'line-width': 5,
              'line-opacity': 0.8
            }
          });
        }
      }
    }
  }, [currentLocation, locations, plannedRoute, destination]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  if (showTokenInput) {
    return (
      <Card className="shadow-card-custom">
        <CardHeader className="bg-gradient-subtle rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Configuração do Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Para visualizar o mapa, insira seu token público do Mapbox. 
            Acesse <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a> para obter seu token.
          </p>
          <Input
            type="password"
            placeholder="Insira seu token público do Mapbox"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <Button 
            onClick={initializeMap}
            disabled={!mapboxToken.trim()}
            className="w-full"
          >
            <Map className="w-4 h-4 mr-2" />
            Inicializar Mapa
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          Mapa em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainer} className="w-full h-96 rounded-b-lg" />
        {(plannedRoute || locations.length > 1) && (
          <div className="p-2 bg-muted/50 text-xs text-center rounded-b-lg">
            <div className="flex justify-center gap-4">
              {plannedRoute && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-400"></div>
                  Rota planejada
                </span>
              )}
              {locations.length > 1 && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-red-400"></div>
                  Percurso realizado
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}