import { ArrowLeft, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types';

interface Props {
  student: Student;
  isEditing: boolean;
  isSaving: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function StudentDetailHeader({
  student,
  isEditing,
  isSaving,
  onBack,
  onStartEdit,
  onCancel,
  onSave,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4">
          {student.photoData ? (
            <img
              src={student.photoData}
              alt={student.name}
              className="w-48 h-48 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground">Подробная информация о студенте</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        ) : (
          <Button onClick={onStartEdit}>Редактировать</Button>
        )}
      </div>
    </div>
  );
}
