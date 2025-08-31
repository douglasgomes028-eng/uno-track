import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getTrips, getTotalKm } from '@/utils/localStorageDB';
import { Trip } from '@/types/tracking';

const StatsSection = () => {
  const [totalKm, setTotalKm] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [kmCost, setKmCost] = useState(0);

  const loadStats = async () => {
    try {
      const [trips, total] = await Promise.all([
        getTrips(),
        getTotalKm()
      ]);
      
      const totalFuel = trips.reduce((sum: number, trip: Trip) => sum + trip.fuelConsumed, 0);
      const totalDistance = trips.reduce((sum: number, trip: Trip) => sum + trip.kmTraveled, 0);
      
      // Assuming fuel cost of R$ 5.50 per liter
      const fuelPrice = 5.50;
      const cost = totalFuel * fuelPrice;
      const costPerKm = totalDistance > 0 ? cost / totalDistance : 0;
      
      setTotalKm(totalDistance);
      setTotalCost(cost);
      setKmCost(costPerKm);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    loadStats();

    const handleUpdate = () => {
      loadStats();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('local-storage-updated', handleUpdate);
    window.addEventListener('trip-completed', handleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('local-storage-updated', handleUpdate);
      window.removeEventListener('trip-completed', handleUpdate);
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalKm.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">KM percorrido</div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-success">R$ {totalCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Custo no período</div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">R$ {kmCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">R$/km</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;