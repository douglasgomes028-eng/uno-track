import { Trip, MaintenanceItem } from '@/types/tracking';

const TRIPS_KEY = 'uno-track-trips';
const MAINTENANCE_KEY = 'uno-track-maintenance';
const LAST_KM_KEY = 'uno-track-last-km';

export function saveTrip(trip: Trip): void {
  const trips = getTrips();
  trips.push(trip);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  
  // Update last KM
  localStorage.setItem(LAST_KM_KEY, trip.endKm.toString());
}

export function getTrips(): Trip[] {
  const tripsData = localStorage.getItem(TRIPS_KEY);
  if (!tripsData) return [];
  
  return JSON.parse(tripsData).map((trip: any) => ({
    ...trip,
    startTime: new Date(trip.startTime),
    endTime: new Date(trip.endTime)
  }));
}

export function getTotalKm(): number {
  const trips = getTrips();
  if (trips.length === 0) return 0;
  
  return trips.reduce((max, trip) => Math.max(max, trip.endKm), 0);
}

export function getLastKm(): number {
  const lastKm = localStorage.getItem(LAST_KM_KEY);
  return lastKm ? parseInt(lastKm) : 0;
}

export function calculateMaintenanceStatus(): MaintenanceItem[] {
  const totalKm = getTotalKm();
  
  const maintenanceItems = [
    { name: 'Troca de óleo', intervalKm: 5000 },
    { name: 'Filtro de ar', intervalKm: 10000 },
    { name: 'Velas de ignição', intervalKm: 20000 },
    { name: 'Correia dentada', intervalKm: 50000 }
  ];

  return maintenanceItems.map(item => {
    const completedIntervals = Math.floor(totalKm / item.intervalKm);
    const lastKm = completedIntervals * item.intervalKm;
    const nextKm = lastKm + item.intervalKm;
    const kmRemaining = nextKm - totalKm;
    
    return {
      ...item,
      lastKm,
      nextKm,
      kmRemaining,
      isOverdue: kmRemaining <= 0
    };
  });
}

export function clearAllData(): void {
  localStorage.removeItem(TRIPS_KEY);
  localStorage.removeItem(MAINTENANCE_KEY);
  localStorage.removeItem(LAST_KM_KEY);
}