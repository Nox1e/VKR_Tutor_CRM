import { Link } from 'react-router-dom';
import { Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddLessonDialog } from '@/components/AddLessonDialog';
import type { Student } from '@/types';

interface Props {
  students: Student[];
  onAddLesson: (lesson: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
    isScheduled?: boolean;
    preparationId?: string;
    homeworkId?: string;
  }) => void;
  onAddStudent: (name: string) => string;
}

export function LessonsPageHeader({ students, onAddLesson, onAddStudent }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Занятия</h1>
          <p className="text-muted-foreground">Управление уроками и расписанием</p>
        </div>
      </div>
      <div className="flex gap-2">
        <AddLessonDialog students={students} onAddLesson={onAddLesson} onAddStudent={onAddStudent} />
        <Button variant="outline" asChild>
          <Link to="/archive">
            <Archive className="w-4 h-4 mr-2" />
            Просмотреть архив
          </Link>
        </Button>
      </div>
    </div>
  );
}
