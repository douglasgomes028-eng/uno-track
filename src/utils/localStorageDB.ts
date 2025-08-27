import { Trip, MaintenanceItem } from '@/types/tracking';

const STORAGE_KEYS = {
  TRIPS: 'uno-track-trips',
  LAST_KM: 'uno-track-last-km'
};

export async function saveTrip(trip: Trip): Promise<void> {
  try {
    const existingTrips = await getTrips();
    const newTrip = {
      ...trip,
      id: crypto.randomUUID(),
      startTime: trip.startTime,
      endTime: trip.endTime
    };
    
    const updatedTrips = [...existingTrips, newTrip];
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(updatedTrips));
    
    // Update last KM
    localStorage.setItem(STORAGE_KEYS.LAST_KM, trip.endKm.toString());
  } catch (error) {
    console.error('Erro ao salvar percurso:', error);
    throw error;
  }
}

export async function getTrips(): Promise<Trip[]> {
  try {
    const tripsData = localStorage.getItem(STORAGE_KEYS.TRIPS);
    if (!tripsData) return [];
    
    const trips = JSON.parse(tripsData);
    return trips.map((trip: any) => ({
      ...trip,
      startTime: new Date(trip.startTime),
      endTime: new Date(trip.endTime)
    })).sort((a: Trip, b: Trip) => b.endTime.getTime() - a.endTime.getTime());
  } catch (error) {
    console.error('Erro ao buscar percursos:', error);
    return [];
  }
}

export async function getTotalKm(): Promise<number> {
  const trips = await getTrips();
  if (trips.length === 0) return 0;
  
  return trips.reduce((max, trip) => Math.max(max, trip.endKm), 0);
}

export async function getTotalKmTraveled(): Promise<number> {
  const trips = await getTrips();
  if (trips.length === 0) return 0;
  
  return trips.reduce((sum, trip) => sum + trip.kmTraveled, 0);
}

export async function getLastKm(): Promise<number> {
  try {
    const lastKm = localStorage.getItem(STORAGE_KEYS.LAST_KM);
    if (!lastKm) return 0;
    return Number(lastKm);
  } catch (error) {
    console.error('Erro ao buscar último KM:', error);
    return 0;
  }
}

export async function calculateMaintenanceStatus(): Promise<MaintenanceItem[]> {
  const totalKmTraveled = await getTotalKmTraveled();
  
  const maintenanceItems = [
    { name: 'Troca de óleo', intervalKm: 5000 },
    { name: 'Filtro de ar', intervalKm: 10000 },
    { name: 'Velas de ignição', intervalKm: 20000 },
    { name: 'Correia dentada', intervalKm: 50000 }
  ];

  return maintenanceItems.map(item => {
    const kmRemaining = item.intervalKm - totalKmTraveled;
    const percentageUsed = (totalKmTraveled / item.intervalKm) * 100;
    
    return {
      ...item,
      lastKm: 0,
      nextKm: item.intervalKm,
      kmRemaining,
      isOverdue: kmRemaining <= 0,
      needsAttention: percentageUsed >= 80 // 80% threshold
    };
  });
}

export async function clearAllData(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.LAST_KM);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  }
}

// Event listener para sincronizar dados entre abas
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.TRIPS || e.key === STORAGE_KEYS.LAST_KM) {
    // Disparar evento customizado para atualizar componentes
    window.dispatchEvent(new CustomEvent('local-storage-updated'));
  }
});