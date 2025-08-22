import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/types/tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Key } from 'lucide-react';

interface MapComponentProps {
  currentLocation: Location | null;
  locations: Location[];
}

export function MapComponent({ currentLocation, locations }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    const initialLocation = currentLocation || { lat: -15.7942, lng: -47.8822 }; // Brasília default

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
  };

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

      // Draw path if we have multiple locations
      if (locations.length > 1) {
        const coordinates = locations.map(loc => [loc.lng, loc.lat]);
        
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        } else {
          map.current.addSource('route', {
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
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4285F4',
              'line-width': 5,
              'line-opacity': 0.8
            }
          });
        }
      }
    }
  }, [currentLocation, locations]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
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
      </CardContent>
    </Card>
  );
}