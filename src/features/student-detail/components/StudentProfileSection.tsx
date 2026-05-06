import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/PhotoUpload';
import type { Student } from '@/types';
import type { StudentFieldKey } from './EditableFieldGrid';
import { EditableFieldGrid, type StudentFieldConfig } from './EditableFieldGrid';

interface StudentProfileSectionProps {
  student: Student;
  isEditing: boolean;
  onChange: (key: StudentFieldKey, value: Student[StudentFieldKey] | undefined) => void;
  onPhotoChange: (value: string | null) => void;
}

export const StudentProfileSection = ({
  student,
  isEditing,
  onChange,
  onPhotoChange,
}: StudentProfileSectionProps) => {
  const fields: StudentFieldConfig[] = [
    {
      key: 'name',
      label: 'ФИО ученика',
      colSpan: 'full',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      placeholder: '@username',
    },
    {
      key: 'phone',
      label: 'Номер телефона',
      placeholder: '+7 (xxx) xxx-xx-xx',
    },
    {
      key: 'birthDate',
      label: 'Дата рождения',
      type: 'date',
    },
    {
      key: 'timezone',
      label: 'Часовой пояс',
      placeholder: 'МСК+2',
    },
    {
      key: 'parentName',
      label: 'ФИО родителя',
      colSpan: 'full',
    },
    {
      key: 'parentTelegram',
      label: 'Telegram родителя',
      placeholder: '@username',
    },
    {
      key: 'parentPhone',
      label: 'Номер телефона родителя',
      placeholder: '+7 (xxx) xxx-xx-xx',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Общая информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <EditableFieldGrid data={student} fields={fields} disabled={!isEditing} onChange={onChange} />

        {isEditing && (
          <PhotoUpload
            value={student.photoData}
            onChange={(value) => onPhotoChange(value ?? null)}
            size="lg"
            showLabel
            label="Фотография ученика"
          />
        )}
      </CardContent>
    </Card>
  );
};
