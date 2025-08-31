import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { MaintenanceItem } from '@/types/tracking';
import { calculateMaintenanceStatus } from '@/utils/localStorageDB';
import { Progress } from '@/components/ui/progress';

const MaintenanceSection = () => {
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);

  const loadMaintenanceStatus = async () => {
    try {
      const items = await calculateMaintenanceStatus();
      setMaintenanceItems(items);
    } catch (error) {
      console.error('Erro ao carregar status de manutenção:', error);
    }
  };

  useEffect(() => {
    loadMaintenanceStatus();

    // Listen for storage changes and trip completion
    const handleStorageChange = () => {
      loadMaintenanceStatus();
    };

    const handleTripCompleted = () => {
      setTimeout(loadMaintenanceStatus, 100); // Small delay to ensure data is saved
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-updated', handleStorageChange);
    window.addEventListener('trip-completed', handleTripCompleted);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-updated', handleStorageChange);
      window.removeEventListener('trip-completed', handleTripCompleted);
    };
  }, []);

  const getMaintenanceStatus = (item: MaintenanceItem & { needsAttention?: boolean }) => {
    if (item.isOverdue) {
      return {
        label: 'Vencida',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-destructive'
      };
    }

    if (item.needsAttention) { // 80% threshold
      return {
        label: 'Revisar',
        variant: 'destructive' as const, // Using destructive for red color
        icon: Clock,
        color: 'text-destructive'
      };
    }

    return {
      label: 'Em dia',
      variant: 'default' as const,
      icon: CheckCircle2,
      color: 'text-success'
    };
  };

  const getProgressValue = (item: MaintenanceItem) => {
    const progress = ((item.intervalKm - item.kmRemaining) / item.intervalKm) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <Card className="w-full shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-4 w-4 text-primary" />
          Manutenção Preventiva
          <div className="text-xs font-normal text-muted-foreground ml-1">
            Fiat Uno 1991
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {maintenanceItems.slice(0, 3).map((item) => {
            const status = getMaintenanceStatus(item);
            const StatusIcon = status.icon;
            
            return (
              <div key={item.name} className="p-3 border rounded-md hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-3 h-3 ${status.color}`} />
                    <h5 className="font-medium text-sm">{item.name}</h5>
                  </div>
                  <Badge variant={status.variant} className="text-xs px-1 py-0">
                    {status.label}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.intervalKm >= 1000 ? `${(item.intervalKm/1000)}k km` : `${item.intervalKm} km`}
                    </span>
                    <span className="font-medium">
                      {item.kmRemaining > 0 
                        ? `${item.kmRemaining.toFixed(0)} km`
                        : `Atrasada`
                      }
                    </span>
                  </div>
                  
                  <Progress 
                    value={getProgressValue(item)} 
                    className="h-1"
                  />
                </div>
              </div>
            );
          })}
          
          {maintenanceItems.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                +{maintenanceItems.length - 3} itens de manutenção
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceSection;