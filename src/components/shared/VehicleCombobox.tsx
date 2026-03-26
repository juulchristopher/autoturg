import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface VehicleComboboxProps {
  placeholder: string;
  options: [string, number][];
  value: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  allLabel?: string;
  className?: string;
}

const MAX_VISIBLE = 200;

export default function VehicleCombobox({
  placeholder,
  options,
  value,
  onSelect,
  disabled = false,
  allLabel,
  className,
}: VehicleComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onSelect(selectedValue === value ? '' : selectedValue);
      setOpen(false);
    },
    [onSelect, value]
  );

  const handleSelectAll = React.useCallback(() => {
    onSelect('');
    setOpen(false);
  }, [onSelect]);

  const visibleOptions = options.slice(0, MAX_VISIBLE);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value={allLabel}
                  onSelect={handleSelectAll}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{allLabel}</span>
                </CommandItem>
              )}
              {visibleOptions.map(([name, count]) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => handleSelect(name)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate flex-1">{name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
