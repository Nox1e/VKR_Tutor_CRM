import { useEffect, type ReactNode } from 'react';
import {
  useForm,
  FormProvider,
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type CommonFieldProps<TValues extends FieldValues> = {
  name: Path<TValues>;
  label?: string;
  description?: string;
  required?: boolean;
  /** Span 1 (default) or 2 columns in a grid-2 layout */
  colSpan?: 1 | 2;
  /** Hide the field rendering — useful for conditional fields handled outside */
  hidden?: boolean;
};

export type FieldConfig<TValues extends FieldValues = FieldValues> =
  | (CommonFieldProps<TValues> & {
      type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'password' | 'date' | 'time';
      placeholder?: string;
      autoFocus?: boolean;
      autoComplete?: string;
    })
  | (CommonFieldProps<TValues> & {
      type: 'textarea';
      placeholder?: string;
      rows?: number;
    })
  | (CommonFieldProps<TValues> & {
      type: 'select';
      placeholder?: string;
      options: Array<{ value: string; label: string }>;
    })
  | (CommonFieldProps<TValues> & {
      type: 'checkbox';
    })
  | (CommonFieldProps<TValues> & {
      type: 'custom';
      render: (params: {
        value: unknown;
        onChange: (value: unknown) => void;
        onBlur: () => void;
      }) => ReactNode;
    });

export interface FormDialogProps<TValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  schema: ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  /** Field configs rendered automatically. If `children` is provided, this is ignored. */
  fields?: FieldConfig<TValues>[];
  /** Render-prop escape hatch for non-trivial forms */
  children?: (form: UseFormReturn<TValues>) => ReactNode;
  trigger?: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  layout?: 'stack' | 'grid-2';
  /** Width override for DialogContent — defaults to max-w-[480px] */
  contentClassName?: string;
  /**
   * Async submit. If it throws, dialog stays open.
   * Resolve normally to close + reset.
   */
  onSubmit: (values: TValues) => void | Promise<void>;
  /** External pending state (e.g. mutation.isPending) — combined with internal state */
  isPending?: boolean;
}

const inputTypes = new Set(['text', 'email', 'tel', 'url', 'number', 'password', 'date', 'time']);

// Radix unmounts the dialog overlay on pointerdown, so the subsequent click
// can leak to the element underneath (e.g. a row's onClick that opens a view
// dialog). Install a one-shot capture-phase listener that swallows that click.
function swallowNextClick() {
  const cleanup = () => {
    document.removeEventListener('click', handler, true);
    window.clearTimeout(timeoutId);
  };
  const handler = (e: MouseEvent) => {
    e.stopPropagation();
    cleanup();
  };
  document.addEventListener('click', handler, true);
  // Safety net: if the click never arrives (e.g. pointerup happened off-screen),
  // drop the listener so it doesn't swallow a future unrelated click.
  const timeoutId = window.setTimeout(cleanup, 300);
}

function FieldRenderer<TValues extends FieldValues>({
  field,
  form,
}: {
  field: FieldConfig<TValues>;
  form: UseFormReturn<TValues>;
}) {
  if (field.hidden) return null;

  const error = form.formState.errors[field.name];
  const errorMsg = typeof error?.message === 'string' ? error.message : null;
  const id = String(field.name);

  const commonLabel = field.label ? (
    <Label htmlFor={id}>
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
    </Label>
  ) : null;

  const wrapperClass = cn('space-y-2', field.colSpan === 2 && 'col-span-2');

  if (field.type === 'checkbox') {
    return (
      <div className={cn('flex items-start gap-2', field.colSpan === 2 && 'col-span-2')}>
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: ctl }) => (
            <Checkbox
              id={id}
              checked={Boolean(ctl.value)}
              onCheckedChange={(v) => ctl.onChange(v === true)}
            />
          )}
        />
        <div className="space-y-1">
          {field.label ? (
            <Label htmlFor={id} className="cursor-pointer leading-none">
              {field.label}
            </Label>
          ) : null}
          {field.description ? (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          ) : null}
          {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className={wrapperClass}>
        {commonLabel}
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: ctl }) => (
            <Textarea
              id={id}
              placeholder={field.placeholder}
              rows={field.rows ?? 4}
              value={(ctl.value as string | undefined) ?? ''}
              onChange={ctl.onChange}
              onBlur={ctl.onBlur}
            />
          )}
        />
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={wrapperClass}>
        {commonLabel}
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: ctl }) => (
            <Select
              value={(ctl.value as string | undefined) ?? ''}
              onValueChange={ctl.onChange}
            >
              <SelectTrigger id={id}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
      </div>
    );
  }

  if (field.type === 'custom') {
    return (
      <div className={wrapperClass}>
        {commonLabel}
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: ctl }) =>
            field.render({
              value: ctl.value,
              onChange: ctl.onChange,
              onBlur: ctl.onBlur,
            }) as JSX.Element
          }
        />
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
      </div>
    );
  }

  if (inputTypes.has(field.type)) {
    return (
      <div className={wrapperClass}>
        {commonLabel}
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: ctl }) => (
            <Input
              id={id}
              type={field.type}
              placeholder={field.placeholder}
              autoFocus={field.autoFocus}
              autoComplete={field.autoComplete}
              value={(ctl.value as string | number | undefined) ?? ''}
              onChange={(e) => {
                if (field.type === 'number') {
                  const n = e.target.value === '' ? undefined : Number(e.target.value);
                  ctl.onChange(n);
                } else {
                  ctl.onChange(e.target.value);
                }
              }}
              onBlur={ctl.onBlur}
            />
          )}
        />
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
      </div>
    );
  }

  return null;
}

export function FormDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  fields,
  children,
  trigger,
  submitLabel = 'Сохранить',
  pendingLabel,
  cancelLabel = 'Отмена',
  layout = 'stack',
  contentClassName,
  onSubmit,
  isPending = false,
}: FormDialogProps<TValues>) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onSubmit',
  });

  // Reset form whenever the dialog opens — keeps stale values out
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
    // defaultValues identity may change per-render; rely on `open` flip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitting = form.formState.isSubmitting || isPending;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  const body = children ? (
    children(form)
  ) : (
    <div className={cn(layout === 'grid-2' ? 'grid grid-cols-2 gap-4' : 'space-y-4')}>
      {(fields ?? []).map((f) => (
        <FieldRenderer key={String(f.name)} field={f} form={form} />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={cn('sm:max-w-[480px]', contentClassName)}
        onPointerDownOutside={swallowNextClick}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {body}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (pendingLabel ?? `${submitLabel}…`) : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
