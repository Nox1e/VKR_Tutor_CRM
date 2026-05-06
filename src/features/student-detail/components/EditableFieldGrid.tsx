import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Student } from '@/types';

export type StudentFieldKey = keyof Student;

export interface StudentFieldConfig {
  key: StudentFieldKey;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 'full' | 'half';
  parse?: (value: string) => Student[StudentFieldKey] | undefined;
  format?: (value: Student[StudentFieldKey]) => string;
}

interface EditableFieldGridProps {
  data: Student;
  fields: StudentFieldConfig[];
  disabled: boolean;
  onChange: (key: StudentFieldKey, value: Student[StudentFieldKey] | undefined) => void;
}

const parseFieldValue = (
  field: StudentFieldConfig,
  value: string,
): Student[StudentFieldKey] | undefined => {
  if (field.parse) {
    return field.parse(value);
  }

  if (field.type === 'number') {
    if (value === '') {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : (parsed as Student[StudentFieldKey]);
  }

  if (value === '') {
    return undefined;
  }

  return value as Student[StudentFieldKey];
};

const formatFieldValue = (field: StudentFieldConfig, value: Student[StudentFieldKey]) => {
  if (field.format) {
    return field.format(value);
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

export const EditableFieldGrid = ({ data, fields, disabled, onChange }: EditableFieldGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {fields.map((field) => {
      const colSpanClass = field.colSpan === 'full' ? 'md:col-span-2' : 'md:col-span-1';
      const rawValue = data[field.key];
      const displayValue = formatFieldValue(field, rawValue);

      const handleValueChange = (nextValue: string) => {
        const parsed = parseFieldValue(field, nextValue);
        onChange(field.key, parsed);
      };

      if (field.type === 'select' && field.options) {
        return (
          <div key={String(field.key)} className={colSpanClass}>
            <Label className="mb-1 block">{field.label}</Label>
            <Select
              value={displayValue || ''}
              onValueChange={handleValueChange}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue placeholder={field.placeholder ?? 'Выберите значение'} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      return (
        <div key={String(field.key)} className={colSpanClass}>
          <Label className="mb-1 block">{field.label}</Label>
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={displayValue}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(event) => handleValueChange(event.target.value)}
          />
        </div>
      );
    })}
  </div>
);
