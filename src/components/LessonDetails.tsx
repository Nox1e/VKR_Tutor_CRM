import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lesson, Student, TimeInterval } from '@/types';
import { formatTime, calculateTotalActiveTime, calculateIndependentTime, isValidUrl } from '@/utils/timeUtils';
import { Play, Pause, ExternalLink, Edit, Trash2, Clock, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditLessonDialog } from './EditLessonDialog';

interface LessonDetailsProps {
  lesson: Lesson;
  student: Student;
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

export function LessonDetails({
  lesson,
  student,
  intervals,
  onToggleTimer,
  onUpdateMeetLink,
  onEditInterval,
  onDeleteInterval,
  onEditLesson
}: LessonDetailsProps) {
  const [meetLink, setMeetLink] = useState(lesson.meetLink || '');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const activeTime = calculateTotalActiveTime(intervals);
  const independentTime = calculateIndependentTime(lesson.startTime, lesson.endTime, intervals);
  const hasActiveInterval = intervals.some(interval => !interval.endTime);
  const activeInterval = intervals.find(interval => !interval.endTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMeetLink(lesson.meetLink || '');
  }, [lesson.meetLink]);

  const handleMeetLinkChange = (value: string) => {
    setMeetLink(value);
    onUpdateMeetLink(value);
  };

  const openMeetLink = () => {
    if (meetLink && isValidUrl(meetLink)) {
      if (!hasActiveInterval) {
        onToggleTimer();
      }
      window.open(meetLink, '_blank');
    }
  };

  const getCurrentIntervalDuration = () => {
    if (!activeInterval) return 0;
    return Math.floor((currentTime.getTime() - activeInterval.startTime.getTime()) / (1000 * 60));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{student.name}</CardTitle>
          <p className="text-muted-foreground">
            {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetLink">Ссылка на звонок</Label>
            <div className="flex gap-2">
              <Input
                id="meetLink"
                value={meetLink}
                onChange={(e) => handleMeetLinkChange(e.target.value)}
                placeholder="https://..."
                className={cn(
                  meetLink && !isValidUrl(meetLink) ? "border-warning" : ""
                )}
              />
              <Button 
                variant="outline"
                onClick={openMeetLink}
                disabled={!meetLink || !isValidUrl(meetLink)}
              >
                <ExternalLink className="w-4 h-4" />
                Открыть
              </Button>
            </div>
            {meetLink && !isValidUrl(meetLink) && (
              <p className="text-sm text-warning">Введите корректную ссылку</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={hasActiveInterval ? "destructive" : "default"}
              size="lg"
              onClick={onToggleTimer}
              className="flex-1"
            >
              {hasActiveInterval ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Остановить ({getCurrentIntervalDuration()}м)
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Запустить таймер
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-primary-light">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{activeTime}м</div>
                  <div className="text-sm text-muted-foreground">Активное время</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-neutral-light">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-foreground">{independentTime}м</div>
                  <div className="text-sm text-muted-foreground">Самостоятельно</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Интервалы активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          {intervals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Интервалы отсутствуют</p>
          ) : (
                         <div className="space-y-2">
               {intervals.map((interval, index) => (
                <div key={interval.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span>
                      {formatTime(interval.startTime)}
                      {interval.endTime ? ` - ${formatTime(interval.endTime)}` : ' - активен'}
                    </span>
                    {interval.endTime && (
                      <span className="text-sm text-muted-foreground">
                        ({Math.floor((interval.endTime.getTime() - interval.startTime.getTime()) / (1000 * 60))}м)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditInterval(interval)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteInterval(interval.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditLessonDialog
        lesson={lesson}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={onEditLesson}
      />
    </div>
  );
}