import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lesson, Student } from '@/types';
import { formatTime, calculateTotalLessonTime, formatDuration } from '@/utils/timeUtils';
import { FileText } from 'lucide-react';

interface DaySummaryProps {
  lessons: Lesson[];
  students: Student[];
}

export function DaySummary({ lessons, students }: DaySummaryProps) {
  const getTotalLessonTime = () => {
    return calculateTotalLessonTime(lessons);
  };

  const totalLessonTime = getTotalLessonTime();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Сводка дня
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{formatDuration(totalLessonTime)}</div>
            <div className="text-sm text-muted-foreground">Общее время занятий</div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Уроки сегодня:</h4>
            {lessons.length === 0 ? (
              <p className="text-muted-foreground text-sm">Уроков нет</p>
            ) : (
              lessons
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .map(lesson => {
                  const student = students.find(s => s.id === lesson.studentId);
                  
                  return (
                    <div key={lesson.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                      <span>{student?.name}</span>
                      <span className="text-muted-foreground">
                        {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}