import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskNumberMultiSelectProps {
  selected: string[];
  onChange: (next: string[]) => void;
  count?: number;
  placeholder?: string;
  className?: string;
}

export function TaskNumberMultiSelect({
  selected,
  onChange,
  count = 27,
  placeholder = 'Все задачи',
  className,
}: TaskNumberMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const taskNumbers = useMemo(
    () => Array.from({ length: count }, (_, i) => (i + 1).toString()),
    [count]
  );

  const toggle = (num: string) => {
    onChange(
      selected.includes(num)
        ? selected.filter((n) => n !== num)
        : [...selected, num]
    );
  };

  const selectAll = () => onChange(taskNumbers);
  const clear = () => onChange([]);

  const sortedSelected = useMemo(
    () => [...selected].sort((a, b) => Number(a) - Number(b)),
    [selected]
  );

  const summary = (() => {
    if (sortedSelected.length === 0) return placeholder;
    if (sortedSelected.length === count) return 'Все задачи';
    if (sortedSelected.length <= 5) return `№ ${sortedSelected.join(', ')}`;
    return `Выбрано: ${sortedSelected.length}`;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full sm:w-72 justify-between font-normal',
            selected.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{summary}</span>
          <div className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {selected.length}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(420px,calc(100vw-2rem))] p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Номера задач ЕГЭ</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-7 px-2 text-xs"
              disabled={selected.length === count}
            >
              Все
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="h-7 px-2 text-xs"
              disabled={selected.length === 0}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Сброс
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {taskNumbers.map((num) => {
            const isSelected = selected.includes(num);
            return (
              <button
                key={num}
                type="button"
                onClick={() => toggle(num)}
                className={cn(
                  'relative h-9 rounded-md border text-sm font-medium transition-colors',
                  'hover:border-primary/60',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'bg-background text-foreground border-input'
                )}
                aria-pressed={isSelected}
              >
                {num}
                {isSelected && (
                  <Check className="w-3 h-3 absolute top-0.5 right-0.5 opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
