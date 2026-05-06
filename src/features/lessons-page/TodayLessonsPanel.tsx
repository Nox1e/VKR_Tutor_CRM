import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { LessonCard } from '@/components/LessonCard';
import type { Lesson, Preparation, Student, TimeInterval } from '@/types';

interface Props {
  students: Student[];
  todayLessons: Lesson[];
  selectedLessonId?: string;
  getLessonIntervals: (lessonId: string) => TimeInterval[];
  getNextPreparationForStudent: (studentId: string) => Preparation | null;

  onSelectLesson: (lessonId: string) => void;
  onToggleTimer: (lessonId: string) => void;
  onOpenMeet: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onArchiveLesson: (lessonId: string) => void;
}

export function TodayLessonsPanel({
  students,
  todayLessons,
  selectedLessonId,
  getLessonIntervals,
  getNextPreparationForStudent,
  onSelectLesson,
  onToggleTimer,
  onOpenMeet,
  onDeleteLesson,
  onArchiveLesson,
}: Props) {
  return (
    <div className="col-span-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Уроки сегодня ({todayLessons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayLessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Уроков на сегодня нет.<br />
              Расписание задаётся в разделе «Календарь».
            </p>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((lesson) => {
                const student = students.find((s) => s.id === lesson.studentId);
                if (!student) return null;
                const nextPreparation = getNextPreparationForStudent(student.id);
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    student={student}
                    intervals={getLessonIntervals(lesson.id)}
                    isSelected={lesson.id === selectedLessonId}
                    onSelect={() => onSelectLesson(lesson.id)}
                    onToggleTimer={() => onToggleTimer(lesson.id)}
                    onOpenMeet={() => onOpenMeet(lesson.id)}
                    onConfirmScheduled={() => {}}
                    onCancelScheduled={() => {}}
                    onDelete={() => onDeleteLesson(lesson.id)}
                    onArchive={() => onArchiveLesson(lesson.id)}
                    nextPreparation={nextPreparation}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
