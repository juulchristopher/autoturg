import type { VehicleSpecs } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  vehicle: VehicleSpecs;
}

export default function VehicleSpecsCard({ vehicle }: Props) {
  const source =
    vehicle.source === 'atv' ? 'Transpordiamet ATV' : 'mntstat.ee';

  type SpecRow = [string, string | number | null | undefined];
  const allSpecs: SpecRow[] = [
    ['Registration', vehicle.regNumber],
    ['Make', vehicle.make],
    ['Model', vehicle.model],
    ['Variant', vehicle.variant],
    ['Year', vehicle.prodYear],
    ['Body type', vehicle.bodyType],
    ['Color', vehicle.color],
    ['Fuel', vehicle.fuelType],
    ['Transmission', vehicle.transmission],
    ['Power', vehicle.powerKw ? `${vehicle.powerKw} kW` : null],
    ['Engine', vehicle.engineCc ? `${vehicle.engineCc} cc` : null],
    ['Weight', vehicle.weightKg ? `${vehicle.weightKg} kg` : null],
    ['County', vehicle.county],
    ['Status', vehicle.status],
    ['VIN', vehicle.vin],
    ['First reg.', vehicle.firstRegDate],
    ['First reg. Estonia', vehicle.firstRegInEstonia],
    ['Owner changes', vehicle.ownerChangeCount],
  ];
  const specs = allSpecs.filter(([, val]) => val != null && val !== '' && val !== 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-semibold">Vehicle Specifications</h3>
          <Badge variant="secondary" className="text-xs">
            {source}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {specs.map(([label, val]) => (
            <div
              key={label}
              className="rounded-lg bg-muted/50 p-3"
            >
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                {label}
              </p>
              <p className="text-sm font-semibold mt-0.5">{String(val)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
