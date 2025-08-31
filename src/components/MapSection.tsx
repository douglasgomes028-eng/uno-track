import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapComponent } from './MapComponent';
import { Map } from 'lucide-react';
import { Location, Route } from '@/types/tracking';

interface MapSectionProps {
  currentLocation?: Location | null;
  locations?: Location[];
  plannedRoute?: Route | null;
  destination?: Location | null;
}

const MapSection: React.FC<MapSectionProps> = ({ 
  currentLocation, 
  locations = [], 
  plannedRoute, 
  destination 
}) => {
  const [hasMapData, setHasMapData] = useState(false);

  useEffect(() => {
    setHasMapData(!!(currentLocation || plannedRoute));
  }, [currentLocation, plannedRoute]);

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-muted/60 to-muted/40 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Map className="h-5 w-5 text-primary" />
          </div>
          Mapa & Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20 min-h-[300px]">
          {hasMapData ? (
            <MapComponent 
              currentLocation={currentLocation}
              locations={locations}
              plannedRoute={plannedRoute}
              destination={destination}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/10 to-muted/5">
              <div className="text-center space-y-2">
                <Map className="w-12 h-12 mx-auto opacity-50" />
                <p className="text-sm">(Mapa - preview)</p>
                <p className="text-xs">Inicie o tracking para ver o mapa</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSection;