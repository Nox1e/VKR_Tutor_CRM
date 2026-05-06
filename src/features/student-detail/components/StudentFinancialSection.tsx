import { DollarSign, History, PenSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types';
import type { StudentFieldKey } from './EditableFieldGrid';
import { EditableFieldGrid, type StudentFieldConfig } from './EditableFieldGrid';

interface StudentFinancialSectionProps {
  student: Student;
  isEditing: boolean;
  onChange: (key: StudentFieldKey, value: Student[StudentFieldKey] | undefined) => void;
  onAddPaymentClick: () => void;
  onPaymentHistoryClick: () => void;
  onEditPaidLessonsClick: () => void;
}

const numberField = (key: StudentFieldKey, label: string, placeholder?: string): StudentFieldConfig => ({
  key,
  label,
  type: 'number',
  placeholder,
  parse: (value) => {
    if (value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : (parsed as Student[StudentFieldKey]);
  },
});

export const StudentFinancialSection = ({
  student,
  isEditing,
  onChange,
  onAddPaymentClick,
  onPaymentHistoryClick,
  onEditPaidLessonsClick,
}: StudentFinancialSectionProps) => {
  const fields: StudentFieldConfig[] = [
    numberField('hourlyRate', 'Почасовая ставка', '1000'),
    numberField('lessonsPerMonth', 'Занятий в месяц', '8'),
    numberField('lessonDuration', 'Время одного занятия (минуты)', '60'),
    {
      key: 'paymentType',
      label: 'Тип оплаты',
      type: 'select',
      options: [
        { value: 'subscription', label: 'Абонемент' },
        { value: 'per-lesson', label: 'По занятиям' },
      ],
    },
    numberField('monthlyRevenue', 'Выручка в месяц', '8000'),
    numberField('acquisitionCost', 'Цена привлечения', '500'),
    {
      key: 'acquisitionSource',
      label: 'Источник привлечения',
      type: 'select',
      options: [
        { value: 'profi', label: 'Профи' },
        { value: 'avito', label: 'Авито' },
        { value: 'referral', label: 'Реферал' },
        { value: 'word-of-mouth', label: 'Сарафан' },
      ],
    },
  ];

  const paidLessonsCount = student.paidLessonsCount ?? 0;
  const paidLessonsIsPositive = paidLessonsCount >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Финансовая информация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`p-4 border rounded-lg ${
            paidLessonsIsPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4
                className={`font-medium ${paidLessonsIsPositive ? 'text-green-900' : 'text-red-900'}`}
              >
                Оплаченные занятия
              </h4>
              <p
                className={`text-2xl font-bold ${paidLessonsIsPositive ? 'text-green-700' : 'text-red-700'}`}
              >
                {paidLessonsCount}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditPaidLessonsClick}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
              >
                <PenSquare className="w-4 h-4" />
                Изменить баланс
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPaymentHistoryClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <History className="w-4 h-4" />
                История оплат
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddPaymentClick}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <Plus className="w-4 h-4" />
                Добавить оплату
              </Button>
            </div>
          </div>
        </div>

        <EditableFieldGrid data={student} fields={fields} disabled={!isEditing} onChange={onChange} />
      </CardContent>
    </Card>
  );
};
