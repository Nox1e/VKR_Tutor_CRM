import { Calendar, CheckCircle, Clock, Plus, BookOpen, Trash2, ListOrdered } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Lesson, ScheduledLesson, TrajectoryItem } from '@/types';
import type { NextLessonInfo } from '../utils/schedule';

interface LessonSelectionTarget {
  id: string;
  title: string;
  type: 'lesson' | 'scheduled';
}

interface StudentLessonsSectionProps {
  isLoading: boolean;
  nextLesson: NextLessonInfo | null;
  currentLesson: Lesson | null;
  completedLessonsCount: number;
  archivedLessons: Lesson[];
  visibleLessonsCount: number;
  onLoadMoreLessons: () => void;
  onSelectPreparationTarget: (target: LessonSelectionTarget) => void;
  onSelectHomeworkTarget: (target: LessonSelectionTarget) => void;
  onTogglePayment: (lessonId: string, currentIsPaid: boolean) => void;
  onAddCompletedLessonClick: () => void;
  onTaskProgressClick: () => void;
  onLearningTrajectoryClick: () => void;
  onDeleteLessonRequest: (lesson: {
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isPaid?: boolean;
  }) => void;
  onLessonClick?: (lesson: Lesson) => void;
  onCopyReminder: () => void;
  getPreparationTitle: (id?: string) => string | null;
  getHomeworkTitle: (id?: string) => string | null;
  getNextDateForDayOfWeek: (dayOfWeek: number) => Date;
  todayDate: Date;
  trajectoryNextItem?: TrajectoryItem | null;
  onApplyTrajectoryNext?: () => void;
  onDismissTrajectoryPrompt?: () => void;
  isApplyingTrajectory?: boolean;
}

const formatLessonTitle = (index: number, date: Date) =>
  `Урок #${index} - ${format(date, 'd MMMM yyyy', { locale: ru })}`;

export const StudentLessonsSection = ({
  isLoading,
  nextLesson,
  currentLesson,
  completedLessonsCount,
  archivedLessons,
  visibleLessonsCount,
  onLoadMoreLessons,
  onSelectPreparationTarget,
  onSelectHomeworkTarget,
  onTogglePayment,
  onAddCompletedLessonClick,
  onTaskProgressClick,
  onLearningTrajectoryClick,
  onDeleteLessonRequest,
  onLessonClick,
  onCopyReminder,
  getPreparationTitle,
  getHomeworkTitle,
  getNextDateForDayOfWeek,
  todayDate,
  trajectoryNextItem,
  onApplyTrajectoryNext,
  onDismissTrajectoryPrompt,
  isApplyingTrajectory,
}: StudentLessonsSectionProps) => {
  const todayDayOfWeek = todayDate.getDay();

  const nextLessonDate = nextLesson?.date ?? null;
  const nextLessonAsLesson =
    nextLesson && nextLesson.type === 'existing' ? (nextLesson.lesson as Lesson) : null;
  const nextLessonAsTemplate =
    nextLesson && nextLesson.type === 'scheduled' ? (nextLesson.lesson as ScheduledLesson) : null;

  const resolveNextLessonTitle = (prefixCount: number) => {
    if (!nextLesson) {
      return '';
    }

    if (nextLessonAsLesson) {
      return formatLessonTitle(prefixCount + 1, nextLessonAsLesson.startTime);
    }

    if (nextLessonAsTemplate) {
      const date = nextLessonDate
        ?? (nextLessonAsTemplate.dayOfWeek === todayDayOfWeek
          ? todayDate
          : getNextDateForDayOfWeek(nextLessonAsTemplate.dayOfWeek));
      return formatLessonTitle(prefixCount + 1, date);
    }

    return '';
  };

  const handleSelectPreparationForNext = () => {
    if (!nextLesson) {
      return;
    }

    const title = resolveNextLessonTitle(completedLessonsCount);

    if (nextLessonAsLesson) {
      onSelectPreparationTarget({ id: nextLessonAsLesson.id, title, type: 'lesson' });
      return;
    }

    if (nextLessonAsTemplate) {
      onSelectPreparationTarget({ id: nextLessonAsTemplate.id, title, type: 'scheduled' });
    }
  };

  const handleSelectHomeworkForNext = () => {
    if (!nextLesson) {
      return;
    }

    const title = resolveNextLessonTitle(completedLessonsCount);

    if (nextLessonAsLesson) {
      onSelectHomeworkTarget({ id: nextLessonAsLesson.id, title, type: 'lesson' });
      return;
    }

    if (nextLessonAsTemplate) {
      onSelectHomeworkTarget({ id: nextLessonAsTemplate.id, title, type: 'scheduled' });
    }
  };

  const renderNextLessonInfo = () => {
    if (!nextLesson) {
      return null;
    }

    const lessonIndex = completedLessonsCount + 1;
    const isActualLesson = Boolean(nextLessonAsLesson);

    const displayDate = (() => {
      if (nextLessonAsLesson) {
        return `${format(nextLessonAsLesson.startTime, 'd MMMM yyyy', { locale: ru })} - ${format(
          nextLessonAsLesson.startTime,
          'HH:mm',
          { locale: ru },
        )} - ${format(nextLessonAsLesson.endTime, 'HH:mm', { locale: ru })}`;
      }

      if (nextLessonAsTemplate) {
        const date = nextLessonDate
          ?? (nextLessonAsTemplate.dayOfWeek === todayDayOfWeek
            ? todayDate
            : getNextDateForDayOfWeek(nextLessonAsTemplate.dayOfWeek));

        return `${format(date, 'd MMMM yyyy', { locale: ru })} - ${nextLessonAsTemplate.startTime} - ${nextLessonAsTemplate.endTime}`;
      }

      return '';
    })();

    const preparationTitle = nextLessonAsLesson
      ? getPreparationTitle(nextLessonAsLesson.preparationId)
      : getPreparationTitle(nextLessonAsTemplate?.preparationId);

    const homeworkTitle = nextLessonAsLesson
      ? getHomeworkTitle(nextLessonAsLesson.homeworkId)
      : getHomeworkTitle(nextLessonAsTemplate?.homeworkId);

    const showTrajectoryPrompt =
      Boolean(trajectoryNextItem) &&
      !preparationTitle &&
      Boolean(onApplyTrajectoryNext);

    const trajectoryPrepLabel = trajectoryNextItem?.preparationTitle
      ?? getPreparationTitle(trajectoryNextItem?.preparationId)
      ?? 'Без названия';

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Следующий запланированный урок
        </h3>
        {showTrajectoryPrompt && (
          <div className="relative mb-3 flex justify-start animate-in fade-in slide-in-from-top-1">
            <div
              role="dialog"
              aria-label="Подсказка из траектории"
              className="relative inline-flex max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md"
            >
              <span className="text-sm text-gray-700">
                Применить{' '}
                <span className="font-semibold text-gray-900">«{trajectoryPrepLabel}»</span>{' '}
                из траектории?
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismissTrajectoryPrompt}
                  disabled={isApplyingTrajectory}
                  className="h-7 px-2 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  Отменить
                </Button>
                <Button
                  size="sm"
                  onClick={onApplyTrajectoryNext}
                  disabled={isApplyingTrajectory}
                  className="h-7 px-3 text-xs"
                >
                  {isApplyingTrajectory ? '…' : 'Применить'}
                </Button>
              </div>
              <span
                aria-hidden="true"
                className="absolute left-6 -bottom-[7px] h-3 w-3 rotate-45 border-r border-b border-gray-200 bg-white"
              />
            </div>
          </div>
        )}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => {
            if (nextLessonAsLesson && onLessonClick) {
              onLessonClick(nextLessonAsLesson);
            } else {
              handleSelectPreparationForNext();
            }
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-blue-800">#{lessonIndex}</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">{displayDate}</span>
                </div>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 rounded p-1 transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  if (nextLessonAsLesson) {
                    onTogglePayment(nextLessonAsLesson.id, nextLessonAsLesson.isPaid ?? false);
                  }
                }}
              >
                <CheckCircle className={`w-4 h-4 ${nextLessonAsLesson?.isPaid ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${nextLessonAsLesson?.isPaid ? 'text-green-600' : 'text-gray-500'}`}>
                  {nextLessonAsLesson?.isPaid ? 'Оплачено' : 'Не оплачено'}
                </span>
              </div>
            </div>

            <div
              className="text-center cursor-pointer hover:bg-blue-100 rounded p-1 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                handleSelectPreparationForNext();
              }}
            >
              <span className="text-base font-bold text-blue-800">
                {preparationTitle ?? 'Подготовка не назначена'}
              </span>
            </div>

            <div className="relative">
              <div
                className="text-center cursor-pointer hover:bg-blue-100 rounded p-1 transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelectHomeworkForNext();
                }}
              >
                <span className="text-sm text-blue-600">ДЗ: {homeworkTitle ?? 'нет'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopyReminder();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 px-2"
              >
                Скопировать напоминание
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTodayLesson = () => {
    if (!currentLesson) {
      return null;
    }

    const lessonIndex = completedLessonsCount + 1;
    const lessonTitle = formatLessonTitle(lessonIndex, currentLesson.startTime);

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          Сегодняшний урок
        </h3>
        <div
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => onLessonClick?.(currentLesson)}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-orange-800">#{lessonIndex}</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-800">
                    {`${format(currentLesson.startTime, 'd MMMM yyyy', { locale: ru })} - ${format(
                      currentLesson.startTime,
                      'HH:mm',
                      { locale: ru },
                    )} - ${format(currentLesson.endTime, 'HH:mm', { locale: ru })}`}
                  </span>
                </div>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-orange-100 rounded p-1 transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  onTogglePayment(currentLesson.id, currentLesson.isPaid ?? false);
                }}
              >
                <CheckCircle className={`w-4 h-4 ${currentLesson.isPaid ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${currentLesson.isPaid ? 'text-green-600' : 'text-gray-500'}`}>
                  {currentLesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                </span>
              </div>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-orange-100 rounded p-1 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                onSelectPreparationTarget({ id: currentLesson.id, title: lessonTitle, type: 'lesson' });
              }}
            >
              <span className="text-base font-bold text-orange-800">
                {getPreparationTitle(currentLesson.preparationId) ?? 'Подготовка не назначена'}
              </span>
            </div>
            <div className="relative">
              <div
                className="text-center cursor-pointer hover:bg-orange-100 rounded p-1 transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectHomeworkTarget({ id: currentLesson.id, title: lessonTitle, type: 'lesson' });
                }}
              >
                <span className="text-sm text-orange-600">
                  ДЗ: {getHomeworkTitle(currentLesson.homeworkId) ?? 'нет'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopyReminder();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 h-6 px-2"
              >
                Скопировать напоминание
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Учебный процесс
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLearningTrajectoryClick}
            className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <ListOrdered className="w-4 h-4" />
            Образовательная траектория
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onTaskProgressClick}
            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <CheckCircle className="w-4 h-4" />
            Прогресс по заданиям
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Загружаем уроки...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderNextLessonInfo()}
            {renderTodayLesson()}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Проведенные уроки ({archivedLessons.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddCompletedLessonClick}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить проведенный урок
                </Button>
              </div>

              {archivedLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Уроков пока не было</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedLessons.slice(0, visibleLessonsCount).map((lesson, index) => {
                    const lessonNumber = completedLessonsCount - index;
                    const lessonTitle = formatLessonTitle(lessonNumber, lesson.startTime);

                    return (
                      <div
                        key={lesson.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => onLessonClick?.(lesson)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-medium text-gray-800">#{lessonNumber}</div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-800">
                                  {`${format(lesson.startTime, 'd MMMM yyyy', { locale: ru })} - ${format(
                                    lesson.startTime,
                                    'HH:mm',
                                    { locale: ru },
                                  )} - ${format(lesson.endTime, 'HH:mm', { locale: ru })}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onTogglePayment(lesson.id, lesson.isPaid ?? false);
                                }}
                              >
                                <CheckCircle className={`w-3 h-3 ${lesson.isPaid ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className={`text-xs ${lesson.isPaid ? 'text-green-600' : 'text-gray-500'}`}>
                                  {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteLessonRequest({
                                    id: lesson.id,
                                    startTime: lesson.startTime,
                                    endTime: lesson.endTime,
                                    title: getPreparationTitle(lesson.preparationId) ?? undefined,
                                    isPaid: lesson.isPaid,
                                  });
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div
                            className="text-center cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectPreparationTarget({
                                id: lesson.id,
                                title: lessonTitle,
                                type: 'lesson',
                              });
                            }}
                          >
                            <span className="text-sm font-bold text-gray-800">
                              {getPreparationTitle(lesson.preparationId) ?? 'Подготовка не назначена'}
                            </span>
                          </div>

                          <div
                            className="text-center cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectHomeworkTarget({ id: lesson.id, title: lessonTitle, type: 'lesson' });
                            }}
                          >
                            <span className="text-xs text-gray-600">
                              ДЗ: {getHomeworkTitle(lesson.homeworkId) ?? 'нет'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {visibleLessonsCount < archivedLessons.length && (
                    <div className="flex justify-center pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoadMoreLessons}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Загрузить еще ({archivedLessons.length - visibleLessonsCount} осталось)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
