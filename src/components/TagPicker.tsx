import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Check, ChevronDown, Plus, Trash2, X, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

interface TagPickerProps {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** When provided, an inline "Create" item appears when the query has no exact match. */
  onCreate?: (name: string) => Promise<Tag | null | undefined>;
  /** When provided, each tag row shows a trash button (with confirmation). */
  onDelete?: (id: string) => Promise<unknown>;
  /** "selector" renders selected chips inline + a small "+ Тег" button for picking.
   *  "filter" renders a single combobox-style trigger summarising the selection. */
  variant?: 'selector' | 'filter';
  placeholder?: string;
  emptyAllLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function TagPicker({
  allTags,
  selectedIds,
  onChange,
  onCreate,
  onDelete,
  variant = 'selector',
  placeholder = 'Поиск тегов…',
  emptyAllLabel = 'Все теги',
  className,
  disabled,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [tagPendingDelete, setTagPendingDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of allTags) map.set(t.id, t);
    return map;
  }, [allTags]);

  const selectedTags = selectedIds
    .map((id) => tagsById.get(id))
    .filter((t): t is Tag => Boolean(t));

  const trimmed = query.trim();
  const lowerTrimmed = trimmed.toLowerCase();
  const exactMatch = trimmed
    ? allTags.find((t) => t.name.toLowerCase() === lowerTrimmed)
    : undefined;

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));
  const clearAll = () => onChange([]);

  const handleCreate = async () => {
    if (!onCreate || !trimmed || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      if (created?.id) {
        onChange([...selectedIds, created.id]);
      }
      setQuery('');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!onDelete || !tagPendingDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(tagPendingDelete.id);
      // Drop from local selection so the picker doesn't show a phantom selected ID.
      if (selectedIds.includes(tagPendingDelete.id)) {
        onChange(selectedIds.filter((x) => x !== tagPendingDelete.id));
      }
      setTagPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const trigger =
    variant === 'filter' ? (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          'w-full sm:w-72 justify-between font-normal',
          selectedIds.length === 0 && 'text-muted-foreground',
          className,
        )}
      >
        <span className="truncate flex items-center gap-2">
          <TagIcon className="w-4 h-4 opacity-60 shrink-0" />
          {selectedTags.length === 0
            ? emptyAllLabel
            : selectedTags.length <= 3
              ? selectedTags.map((t) => t.name).join(', ')
              : `Выбрано: ${selectedTags.length}`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {selectedIds.length}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </div>
      </Button>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="h-7 px-2 text-xs gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Тег
      </Button>
    );

  const popoverContent = (
    <PopoverContent
      align="start"
      className="w-[min(360px,calc(100vw-2rem))] p-0"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {(() => {
            const filtered = lowerTrimmed
              ? allTags.filter((t) => t.name.toLowerCase().includes(lowerTrimmed))
              : allTags;
            if (filtered.length === 0 && !onCreate) {
              return <CommandEmpty>Ничего не найдено</CommandEmpty>;
            }
            return (
              <>
                {filtered.length > 0 && (
                  <CommandGroup>
                    {filtered.map((t) => {
                      const isSelected = selectedIds.includes(t.id);
                      return (
                        <CommandItem
                          key={t.id}
                          value={t.id}
                          onSelect={() => toggle(t.id)}
                          className="group cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate flex-1">{t.name}</span>
                          {t.color && (
                            <span
                              className="ml-2 h-3 w-3 rounded-full border border-border/50"
                              style={{ backgroundColor: t.color }}
                            />
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTagPendingDelete(t);
                              }}
                              className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                              aria-label={`Удалить тег ${t.name}`}
                              title="Удалить тег"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {filtered.length === 0 && onCreate && trimmed && (
                  <CommandEmpty>Совпадений нет</CommandEmpty>
                )}
                {onCreate && trimmed && !exactMatch && (
                  <>
                    {filtered.length > 0 && <CommandSeparator />}
                    <CommandGroup>
                      <CommandItem
                        value={`__create__${trimmed}`}
                        onSelect={handleCreate}
                        disabled={creating}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Создать «{trimmed}»
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
                {variant === 'filter' && selectedIds.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value="__clear__"
                        onSelect={clearAll}
                        className="cursor-pointer text-muted-foreground"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Сбросить
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            );
          })()}
        </CommandList>
      </Command>
    </PopoverContent>
  );

  const deleteConfirmDialog = onDelete ? (
    <AlertDialog
      open={!!tagPendingDelete}
      onOpenChange={(o) => !o && setTagPendingDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить тег?</AlertDialogTitle>
          <AlertDialogDescription>
            Тег «{tagPendingDelete?.name}» будет удалён и отвязан от всех элементов, к которым он прикреплён. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirmDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  if (variant === 'filter') {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          {popoverContent}
        </Popover>
        {deleteConfirmDialog}
      </>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {selectedTags.map((t) => (
        <Badge
          key={t.id}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-0.5"
          style={t.color ? { backgroundColor: t.color, color: '#fff' } : undefined}
        >
          {t.name}
          <button
            type="button"
            onClick={() => remove(t.id)}
            className="rounded-sm hover:bg-black/10 p-0.5"
            aria-label={`Удалить тег ${t.name}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        {popoverContent}
      </Popover>
      {deleteConfirmDialog}
    </div>
  );
}
