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
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Manutenção Preventiva - Fiat Uno 1991
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-primary mb-2">Recomendações da Fábrica</h4>
          <p className="text-sm text-muted-foreground">
            Baseado nas especificações oficiais do Fiat Uno 1991 Motor Fiasa 1.0.
            Mantenha seu veículo sempre em dia para garantir performance e durabilidade.
          </p>
        </div>

        <div className="space-y-4">
          {maintenanceItems.map((item) => {
            const status = getMaintenanceStatus(item);
            const StatusIcon = status.icon;
            
            return (
              <div key={item.name} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <h4 className="font-medium">{item.name}</h4>
                  </div>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      A cada {item.intervalKm.toLocaleString()} km
                    </span>
                    <span className="font-medium">
                      {item.kmRemaining > 0 
                        ? `Faltam ${item.kmRemaining.toFixed(0)} km`
                        : `Atrasada ${Math.abs(item.kmRemaining).toFixed(0)} km`
                      }
                    </span>
                  </div>
                  
                  <Progress 
                    value={getProgressValue(item)} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Última: {item.lastKm.toLocaleString()} km</span>
                    <span>Próxima: {item.nextKm.toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Importante
          </h5>
          <p className="text-sm text-muted-foreground">
            Estas são recomendações gerais para o Fiat Uno 1991. Consulte sempre um profissional 
            qualificado e considere as condições de uso do seu veículo (urbano, rodoviário, etc.).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceSection;