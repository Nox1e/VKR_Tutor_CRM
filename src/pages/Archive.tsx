import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Calendar, Clock, User, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiClient } from "@/api/client";

interface Lesson {
  id: string;
  studentId: string;
  startTime: string;
  endTime: string;
  status: string;
  comment?: string;
}

interface Student {
  id: string;
  name: string;
}

interface DayGroup {
  date: Date;
  lessons: Lesson[];
}

export default function Archive() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedDays, setDisplayedDays] = useState(7);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [lessonsData, studentsData] = await Promise.all([
          apiClient.get<Lesson[]>('/lessons'),
          apiClient.get<Student[]>('/students'),
        ]);

        setLessons(lessonsData);
        setStudents(studentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const archivedLessons = useMemo(
    () => lessons.filter(lesson => lesson.status === 'archived'),
    [lessons]
  );

  useEffect(() => {
    if (archivedLessons.length === 0) {
      setDayGroups([]);
      return;
    }

    const grouped: Record<string, DayGroup> = {};

    archivedLessons.forEach((lesson) => {
      if (!lesson.startTime) return;
      const lessonDate = new Date(lesson.startTime);
      if (isNaN(lessonDate.getTime())) return;

      const dateKey = lessonDate.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate()),
          lessons: [],
        };
      }
      grouped[dateKey].lessons.push(lesson);
    });

    const sortedGroups = Object.values(grouped).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    sortedGroups.forEach((group) => {
      group.lessons.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    setDayGroups(sortedGroups);
  }, [archivedLessons]);

  const loadMoreDays = () => {
    setDisplayedDays(prev => Math.min(prev + 7, 365));
  };

  const hasMoreData = useMemo(
    () => archivedLessons.length > 10 && displayedDays < 365,
    [archivedLessons.length, displayedDays]
  );

  const restoreLesson = async (lessonId: string) => {
    try {
      await apiClient.put(`/lessons/${lessonId}`, { status: 'completed' });
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId ? { ...lesson, status: 'completed' } : lesson
      ));
    } catch (error) {
      console.error('Ошибка при восстановлении урока:', error);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок навсегда?')) {
      return;
    }
    try {
      await apiClient.delete(`/lessons/${lessonId}`);
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Ошибка при удалении урока:', error);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Неизвестный ученик';
  };

  const formatTime = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '--:--';
    return format(date, 'HH:mm', { locale: ru });
  };

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 'Неизвестная дата';
    return format(date, 'd MMMM', { locale: ru });
  };

  const getDayOfWeek = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 'Неизвестный день';
    const dayName = format(date, 'EEEE', { locale: ru });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-500">
                Ошибка: {error}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Archive className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Архив занятий</h1>
              <p className="text-muted-foreground">
                {archivedLessons.length} архивированных занятий
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Загрузка архива...
              </div>
            </CardContent>
          </Card>
        ) : dayGroups.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Архив пуст
              </CardTitle>
              <CardDescription>
                Здесь будут отображаться архивированные занятия
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Архивированных занятий не найдено.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {dayGroups.map((group) => (
              <Card key={group.date.toISOString()}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {getDayOfWeek(group.date)} - {formatDate(group.date)}
                  </CardTitle>
                  <CardDescription>
                    {group.lessons.length} занятий
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {getStudentName(lesson.studentId)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(new Date(lesson.startTime))} - {formatTime(new Date(lesson.endTime))}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            Архивировано
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreLesson(lesson.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Вернуть в список текущих уроков"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Удалить урок навсегда"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMoreData && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMoreDays}
                  className="flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4" />
                  Загрузить еще 7 дней
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
