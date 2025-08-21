import { supabase } from '@/integrations/supabase/client';
import { Trip, MaintenanceItem } from '@/types/tracking';

export async function saveTrip(trip: Trip): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .insert({
      start_km: trip.startKm,
      end_km: trip.endKm,
      km_traveled: trip.kmTraveled,
      fuel_consumed: trip.fuelConsumed,
      average_consumption: trip.averageConsumption,
      start_time: trip.startTime.toISOString(),
      end_time: trip.endTime.toISOString(),
      locations: JSON.stringify(trip.locations),
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

  if (error) {
    console.error('Erro ao salvar percurso:', error);
    throw error;
  }
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('end_time', { ascending: false });

  if (error) {
    console.error('Erro ao buscar percursos:', error);
    return [];
  }

  return (data || []).map((trip: any) => ({
    id: trip.id,
    startKm: Number(trip.start_km),
    endKm: Number(trip.end_km),
    kmTraveled: Number(trip.km_traveled),
    fuelConsumed: Number(trip.fuel_consumed),
    averageConsumption: Number(trip.average_consumption),
    startTime: new Date(trip.start_time),
    endTime: new Date(trip.end_time),
    locations: JSON.parse(trip.locations || '[]')
  }));
}

export async function getTotalKm(): Promise<number> {
  const trips = await getTrips();
  if (trips.length === 0) return 0;
  
  return trips.reduce((max, trip) => Math.max(max, trip.endKm), 0);
}

export async function getLastKm(): Promise<number> {
  const { data, error } = await supabase
    .from('trips')
    .select('end_km')
    .order('end_time', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;
  return Number(data.end_km);
}

export async function calculateMaintenanceStatus(): Promise<MaintenanceItem[]> {
  const totalKm = await getTotalKm();
  
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

export async function clearAllData(): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user trips

  if (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  }
}