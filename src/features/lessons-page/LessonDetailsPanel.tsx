import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LessonDetails } from '@/components/LessonDetails';
import type { Lesson, Student, TimeInterval } from '@/types';

interface Props {
  selectedLesson: Lesson | undefined;
  students: Student[];
  intervals: TimeInterval[];
  onToggleTimer: () => void;
  onUpdateMeetLink: (meetLink: string) => void;
  onEditInterval: (interval: TimeInterval) => void;
  onDeleteInterval: (intervalId: string) => void;
  onEditLesson: (lessonId: string, updates: {
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
  }) => void;
}

export function LessonDetailsPanel({
  selectedLesson,
  students,
  intervals,
  onToggleTimer,
  onUpdateMeetLink,
  onEditInterval,
  onDeleteInterval,
  onEditLesson,
}: Props) {
  if (!selectedLesson) {
    return (
      <div className="col-span-5">
        <Card className="h-full flex items-center justify-center">
          <CardContent>
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Выберите урок для просмотра деталей</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = students.find((s) => s.id === selectedLesson.studentId);

  if (!student) {
    return (
      <div className="col-span-5">
        <Card className="h-full flex items-center justify-center">
          <CardContent>
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ученик не найден</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="col-span-5">
      <LessonDetails
        lesson={selectedLesson}
        student={student}
        intervals={intervals}
        onToggleTimer={onToggleTimer}
        onUpdateMeetLink={onUpdateMeetLink}
        onEditInterval={onEditInterval}
        onDeleteInterval={onDeleteInterval}
        onEditLesson={onEditLesson}
      />
    </div>
  );
}
