import { Car, Gauge } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-automotive text-primary-foreground py-4 px-6 shadow-automotive">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Car className="w-8 h-8" />
            <Gauge className="w-4 h-4 absolute -bottom-1 -right-1 bg-primary-foreground text-primary rounded-full p-0.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Uno Track</h1>
            <p className="text-primary-foreground/80 text-sm">Controle de quilometragem</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-primary-foreground/90 text-sm font-medium">ID do veículo:</p>
          <p className="text-primary-foreground font-bold">FIAT-UNO-1991</p>
        </div>
      </div>
    </header>
  );
}