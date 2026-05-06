import { useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: ReactNode;
  description?: ReactNode;
  /** Optional icon rendered next to the title */
  icon?: ReactNode;

  items: T[];
  isLoading?: boolean;

  /** Currently selected item — used to render the "current" panel and pre-select */
  current?: T | null;
  /** Stable id getter for keying / equality */
  getId: (item: T) => string;
  /** Fields to search across (case-insensitive substring match) */
  searchKeys?: (item: T) => Array<string | undefined | null>;
  searchPlaceholder?: string;
  /** Render a single row in the list — receives item + isSelected */
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  /** Render the small "current" panel above the list when current is set */
  renderCurrent?: (item: T) => ReactNode;

  /** Custom action(s) for the current panel (e.g. Copy). Rendered after renderCurrent. */
  currentActions?: (item: T) => ReactNode;

  emptyMessage?: ReactNode;
  emptyIcon?: ReactNode;

  selectLabel?: string;
  cancelLabel?: string;
  removeLabel?: string;
  /** When true and current is set, shows "Remove" button that fires onSelect(null) */
  allowRemove?: boolean;

  /** Result handler — null means "deselect / remove" */
  onSelect: (item: T | null) => void;

  contentClassName?: string;
  scrollClassName?: string;
}

export function SelectDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  icon,
  items,
  isLoading = false,
  current,
  getId,
  searchKeys,
  searchPlaceholder = 'Поиск…',
  renderItem,
  renderCurrent,
  currentActions,
  emptyMessage = 'Ничего не найдено',
  emptyIcon,
  selectLabel = 'Назначить',
  cancelLabel = 'Отмена',
  removeLabel = 'Убрать',
  allowRemove = true,
  onSelect,
  contentClassName,
  scrollClassName,
}: SelectDialogProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<T | null>(current ?? null);

  // Reset selection + search whenever the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(current ?? null);
      setSearchTerm('');
    }
  }, [open, current]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim() || !searchKeys) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((item) =>
      searchKeys(item).some((value) => value && value.toLowerCase().includes(q)),
    );
  }, [items, searchTerm, searchKeys]);

  const currentId = current ? getId(current) : null;
  const selectedId = selected ? getId(selected) : null;
  const selectionUnchanged = selectedId === currentId;

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onSelect(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl max-h-[80vh]', contentClassName)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4">
          {searchKeys ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          ) : null}

          {current && (renderCurrent || currentActions || allowRemove) ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {renderCurrent ? (
                    renderCurrent(current)
                  ) : (
                    <p className="text-sm text-blue-900">Текущее назначение</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {currentActions ? currentActions(current) : null}
                  {allowRemove ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemove}
                      className="text-red-600 hover:text-red-700"
                    >
                      {removeLabel}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Выберите вариант:</Label>
            <ScrollArea className={cn('h-64 border rounded-lg', scrollClassName)}>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  {emptyIcon ? <div className="mb-4 opacity-50">{emptyIcon}</div> : null}
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filtered.map((item) => {
                    const id = getId(item);
                    const isSelected = id === selectedId;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setSelected(item)}
                        className={cn(
                          'w-full text-left p-3 border rounded-lg cursor-pointer transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">{renderItem(item, isSelected)}</div>
                          {isSelected ? (
                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button onClick={handleConfirm} disabled={selectionUnchanged && current !== null}>
              {selected ? selectLabel : removeLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
