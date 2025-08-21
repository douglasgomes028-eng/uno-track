import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { calculateMaintenanceStatus } from '@/utils/storage';
import { MaintenanceItem } from '@/types/tracking';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export function MaintenanceSection() {
  const { user } = useAuth();
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);

  useEffect(() => {
    const updateMaintenance = async () => {
      if (!user) return;
      
      try {
        const items = await calculateMaintenanceStatus();
        setMaintenanceItems(items);
      } catch (error) {
        console.error('Error loading maintenance data:', error);
      }
    };

    updateMaintenance();
    
    // Listen for storage changes to update maintenance status
    window.addEventListener('storage', updateMaintenance);
    
    return () => window.removeEventListener('storage', updateMaintenance);
  }, [user]);

  const getStatusIcon = (item: MaintenanceItem) => {
    if (item.isOverdue) {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    } else if (item.kmRemaining <= 500) {
      return <Clock className="w-4 h-4 text-warning" />;
    }
    return <CheckCircle className="w-4 h-4 text-success" />;
  };

  const getStatusBadge = (item: MaintenanceItem) => {
    if (item.isOverdue) {
      return <Badge variant="destructive">Atrasada</Badge>;
    } else if (item.kmRemaining <= 500) {
      return <Badge className="bg-warning text-warning-foreground">Próxima</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Em dia</Badge>;
  };

  const getProgressValue = (item: MaintenanceItem) => {
    const progress = ((item.intervalKm - item.kmRemaining) / item.intervalKm) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (!user) {
    return (
      <Card className="shadow-card-custom">
        <CardHeader className="bg-gradient-subtle rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Manutenção Preventiva - Fiat Uno 1991
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Faça login para acompanhar a manutenção do seu veículo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card-custom">
      <CardHeader className="bg-gradient-subtle rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          Manutenção Preventiva - Fiat Uno 1991
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-primary mb-2">Recomendações da Fábrica</h4>
          <p className="text-sm text-muted-foreground">
            Baseado nas especificações oficiais do Fiat Uno 1991 Motor Fiasa 1.0.
            Mantenha seu veículo sempre em dia para garantir performance e durabilidade.
          </p>
        </div>

        <div className="space-y-4">
          {maintenanceItems.map((item) => (
            <div key={item.name} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item)}
                  <h4 className="font-medium">{item.name}</h4>
                </div>
                {getStatusBadge(item)}
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
          ))}
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
}