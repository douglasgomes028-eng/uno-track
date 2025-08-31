import { Car, Gauge } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-automotive text-primary-foreground py-6 px-4 shadow-automotive">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <div className="relative">
          <Car className="w-8 h-8" />
          <Gauge className="w-4 h-4 absolute -bottom-1 -right-1 bg-primary-foreground text-primary rounded-full p-0.5" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Uno Track</h1>
          <p className="text-primary-foreground/80 text-sm">Fiat Uno 1991 - Controle Inteligente</p>
        </div>
      </div>
    </header>
  );
}