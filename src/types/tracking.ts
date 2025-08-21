export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Trip {
  id: string;
  startKm: number;
  endKm: number;
  kmTraveled: number;
  fuelConsumed: number;
  averageConsumption: number;
  startTime: Date;
  endTime: Date;
  locations: Location[];
}

export interface MaintenanceItem {
  name: string;
  intervalKm: number;
  lastKm: number;
  nextKm: number;
  kmRemaining: number;
  isOverdue: boolean;
}

export interface TrackingState {
  isTracking: boolean;
  currentTrip: Partial<Trip> | null;
  startKm: number;
  currentLocation: Location | null;
  totalDistance: number;
}