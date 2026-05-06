import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventInput,
  EventClickArg,
  EventDropArg,
  DateSelectArg,
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { CalendarDays, Plus, Trash2, Info, Wand2, Edit3, User as UserIcon, Palette } from 'lucide-react';

import {
  useScheduledLessons,
  useCreateScheduledLesson,
  useUpdateScheduledLesson,
  useDeleteScheduledLesson,
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useStudents,
  useUpdateStudent,
} from '@/hooks/useApi';
import type { Lesson, ScheduledLesson, Student } from '@/types';
import type { ScheduledLessonDto } from '@shared/api/contracts';
import { getShortName } from '@/utils/nameUtils';
import { useMaterializeWeek } from '@/features/calendar-page/useMaterializeWeek';
import { useApplyToFutureWeeks } from '@/features/calendar-page/useApplyToFutureWeeks';
import { useReplaceWeekWithTemplate } from '@/features/calendar-page/useReplaceWeekWithTemplate';

import './Calendar.css';

type Mode = 'real' | 'template';

// Abstract anchor date for the template "week" — never visible to the user
// because template headers are masked to weekday-only. Chosen to start on a
// Monday so FC's firstDay=1 aligns cleanly.
const TEMPLATE_ANCHOR = new Date(2000, 0, 3); // Mon 2000-01-03

// Per-student colour presets. `student.color` stores the key (e.g. "red");
// a null/unknown key falls back to the neutral blue. Storing a key (not a
// raw HSL string) keeps bg/border in sync without parsing CSS colours.
export const COLOR_PRESETS: Record<string, { bg: string; border: string; label: string }> = {
  blue:   { bg: 'hsl(214 48% 58%)', border: 'hsl(214 48% 48%)', label: 'Синий' },
  red:    { bg: 'hsl(0 55% 58%)',   border: 'hsl(0 55% 48%)',   label: 'Красный' },
  orange: { bg: 'hsl(24 60% 55%)',  border: 'hsl(24 60% 45%)',  label: 'Оранжевый' },
  amber:  { bg: 'hsl(42 55% 50%)',  border: 'hsl(42 55% 40%)',  label: 'Янтарный' },
  green:  { bg: 'hsl(142 40% 48%)', border: 'hsl(142 40% 38%)', label: 'Зелёный' },
  teal:   { bg: 'hsl(182 40% 46%)', border: 'hsl(182 40% 36%)', label: 'Бирюзовый' },
  violet: { bg: 'hsl(262 38% 60%)', border: 'hsl(262 38% 50%)', label: 'Фиолетовый' },
  pink:   { bg: 'hsl(330 45% 62%)', border: 'hsl(330 45% 52%)', label: 'Розовый' },
  gray:   { bg: 'hsl(215 10% 55%)', border: 'hsl(215 10% 45%)', label: 'Серый' },
};

const DEFAULT_COLOR_KEY = 'blue';

function resolveColor(studentColor: string | null | undefined) {
  if (studentColor && COLOR_PRESETS[studentColor]) return COLOR_PRESETS[studentColor];
  return COLOR_PRESETS[DEFAULT_COLOR_KEY];
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toHHMM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseHHMM(value: string, base: Date): Date {
  const [h, m] = value.split(':').map(Number);
  const out = new Date(base);
  out.setHours(h, m, 0, 0);
  return out;
}

/**
 * Compute which unpaid lessons won't be covered by the student's current
 * paid balance. Unpaid lessons are matched against the balance earliest-
 * first (matching the completion worker's order), so the tail that can't
 * be paid is flagged. Archived lessons are ignored.
 */
function computeInsufficientBalanceSet(lessons: Lesson[], students: Student[]): Set<string> {
  const byStudent = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    if (lesson.status === 'archived') continue;
    if (lesson.isPaid) continue;
    const arr = byStudent.get(lesson.studentId) ?? [];
    arr.push(lesson);
    byStudent.set(lesson.studentId, arr);
  }

  const insufficient = new Set<string>();
  const balanceById = new Map(students.map((s) => [s.id, Math.max(0, s.paidLessonsCount ?? 0)]));

  for (const [studentId, arr] of byStudent) {
    const balance = balanceById.get(studentId) ?? 0;
    arr.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = balance; i < arr.length; i += 1) {
      insufficient.add(arr[i].id);
    }
  }

  return insufficient;
}

function buildLessonEvents(
  lessons: Lesson[],
  students: Student[],
  rangeStart: Date,
  rangeEnd: Date,
  insufficientBalanceIds: Set<string>,
): EventInput[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const events: EventInput[] = [];

  for (const lesson of lessons) {
    if (lesson.status === 'archived') continue;
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    if (start >= rangeEnd || end <= rangeStart) continue;

    const student = studentById.get(lesson.studentId);
    const studentName = student ? getShortName(student.name) : 'Ученик';
    // `active` lessons (timer running) must not be dragged around. `completed`
    // lessons CAN be dragged — moving one into the future reverts it to
    // 'planned' on the backend and refunds the balance.
    const isActive = lesson.status === 'active';
    const isCompleted = lesson.status === 'completed';
    const hasPrep = Boolean(lesson.preparationId);
    const noBalance = insufficientBalanceIds.has(lesson.id);
    const color = resolveColor(student?.color);

    const classNames: string[] = [];
    if (isCompleted) classNames.push('fc-event--completed');
    if (!hasPrep && !isActive) classNames.push('fc-event--no-prep');
    if (noBalance && !isActive) classNames.push('fc-event--no-balance');

    // No preparation → neutral pale bg (keeps the student colour on the
    // left accent strip for identification). Active keeps its own grey.
    const bg = isActive
      ? 'hsl(215 15% 60%)'
      : !hasPrep
        ? 'hsl(215 12% 88%)'
        : color.bg;
    const border = isActive ? 'hsl(215 15% 50%)' : color.border;
    const text = isActive ? '#fff' : !hasPrep ? 'hsl(215 25% 25%)' : '#fff';

    events.push({
      id: `lesson:${lesson.id}`,
      title: studentName,
      start,
      end,
      backgroundColor: bg,
      borderColor: border,
      textColor: text,
      editable: !isActive,
      classNames: classNames.length ? classNames : undefined,
      extendedProps: {
        kind: 'lesson' as const,
        lessonId: lesson.id,
        studentId: lesson.studentId,
        status: lesson.status,
        comment: lesson.comment,
        meetLink: lesson.meetLink,
        noBalance,
      },
    });
  }

  return events;
}

function buildTemplateEvents(
  scheduledLessons: ScheduledLesson[],
  students: Student[],
): EventInput[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const events: EventInput[] = [];

  for (const sl of scheduledLessons) {
    const day = new Date(TEMPLATE_ANCHOR);
    // TEMPLATE_ANCHOR is a Monday (day=1); map dayOfWeek (0=Sun) onto that week
    const offset = (sl.dayOfWeek + 6) % 7;
    day.setDate(day.getDate() + offset);
    const start = parseHHMM(sl.startTime, day);
    const end = parseHHMM(sl.endTime, day);
    if (end <= start) continue;

    const student = studentById.get(sl.studentId);
    const studentName = student ? getShortName(student.name) : 'Ученик';
    const hasPrep = Boolean(sl.preparationId);
    const color = resolveColor(student?.color);

    events.push({
      id: `sched:${sl.id}`,
      title: studentName,
      start,
      end,
      backgroundColor: color.bg,
      borderColor: color.border,
      textColor: '#fff',
      classNames: hasPrep ? undefined : ['fc-event--no-prep'],
      extendedProps: {
        kind: 'scheduled' as const,
        scheduledLessonId: sl.id,
        studentId: sl.studentId,
        comment: sl.comment,
        meetLink: sl.meetLink,
      },
    });
  }

  return events;
}

const DAY_OPTIONS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' },
];

// ---------- Real-mode dialog (concrete Lesson) ----------

interface LessonFormState {
  studentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  meetLink: string;
  comment: string;
}

const emptyLessonForm: LessonFormState = {
  studentId: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  meetLink: '',
  comment: '',
};

interface LessonDialogState {
  mode: 'create' | 'edit';
  values: LessonFormState;
  editingId?: string;
  status?: Lesson['status'];
}

// ---------- Template-mode dialog (ScheduledLesson) ----------

interface TemplateFormState {
  studentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  meetLink: string;
  comment: string;
}

const emptyTemplateForm: TemplateFormState = {
  studentId: '',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  meetLink: '',
  comment: '',
};

interface TemplateDialogState {
  mode: 'create' | 'edit';
  values: TemplateFormState;
  editingId?: string;
}

// ---------- Page ----------

export default function CalendarPage() {
  const [mode, setMode] = useState<Mode>('real');

  const { data: scheduledLessons = [], isLoading: slLoading } = useScheduledLessons();
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isFetching: lessonsFetching,
  } = useLessons();
  const { data: students = [], isLoading: studentsLoading } = useStudents();

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const createScheduled = useCreateScheduledLesson();
  const updateScheduled = useUpdateScheduledLesson();
  const deleteScheduled = useDeleteScheduledLesson();

  const materializeWeek = useMaterializeWeek();
  const applyToFuture = useApplyToFutureWeeks();
  const replaceWeek = useReplaceWeekWithTemplate();
  const updateStudent = useUpdateStudent();
  const navigate = useNavigate();
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  type CtxTarget =
    | { kind: 'lesson'; lessonId: string; studentId: string }
    | { kind: 'scheduled'; scheduledLessonId: string; studentId: string };
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: CtxTarget } | null>(
    null,
  );
  const [colorPickerStudentId, setColorPickerStudentId] = useState<string | null>(null);

  const calendarRef = useRef<FullCalendar | null>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);

  const [lessonDialog, setLessonDialog] = useState<LessonDialogState | null>(null);
  const [templateDialog, setTemplateDialog] = useState<TemplateDialogState | null>(null);

  // Materialise visible week whenever range or scheduled lessons change (idempotent).
  // Gate on !lessonsFetching so we never run with stale cache data — otherwise a
  // just-created lesson wouldn't be visible to the dedup check and we'd duplicate it.
  useEffect(() => {
    if (mode !== 'real' || !visibleRange) return;
    if (scheduledLessons.length === 0) return;
    if (lessonsFetching) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visibleRange.end <= today) return; // skip pure-past weeks
    void materializeWeek(visibleRange.start, scheduledLessons, lessons);
  }, [mode, visibleRange, scheduledLessons, lessons, lessonsFetching, materializeWeek]);

  const insufficientBalanceIds = useMemo(
    () => computeInsufficientBalanceSet(lessons, students),
    [lessons, students],
  );

  const events = useMemo<EventInput[]>(() => {
    if (students.length === 0) return [];
    if (mode === 'real') {
      if (!visibleRange) return [];
      return buildLessonEvents(
        lessons,
        students,
        visibleRange.start,
        visibleRange.end,
        insufficientBalanceIds,
      );
    }
    return buildTemplateEvents(scheduledLessons, students);
  }, [mode, lessons, scheduledLessons, students, visibleRange, insufficientBalanceIds]);

  // ---------- Real-mode handlers ----------

  const offerApplyToFuture = useCallback(
    (before: {
      studentId: string;
      oldStart: Date;
      oldEnd: Date;
      newStart: Date;
      newEnd: Date;
    }) => {
      if (!visibleRange) return;
      toast({
        title: 'Обновить шаблон?',
        description: 'Применить новое время к будущим неделям',
        action: (
          <ToastAction
            altText="Применить к будущим неделям"
            onClick={() => {
              void applyToFuture({
                studentId: before.studentId,
                oldDayOfWeek: before.oldStart.getDay(),
                oldStartTime: toHHMM(before.oldStart),
                oldEndTime: toHHMM(before.oldEnd),
                newDayOfWeek: before.newStart.getDay(),
                newStartTime: toHHMM(before.newStart),
                newEndTime: toHHMM(before.newEnd),
                anchorWeekStart: visibleRange.start,
                scheduledLessons,
                lessons,
              });
            }}
          >
            Применить
          </ToastAction>
        ),
      });
    },
    [applyToFuture, lessons, scheduledLessons, visibleRange],
  );

  const handleLessonDrop = useCallback(
    (arg: EventDropArg) => {
      const lessonId = arg.event.extendedProps.lessonId as string | undefined;
      const oldStart = arg.oldEvent.start;
      const oldEnd = arg.oldEvent.end;
      if (!lessonId || !arg.event.start || !arg.event.end || !oldStart || !oldEnd) {
        arg.revert();
        return;
      }
      const newStart = arg.event.start;
      const newEnd = arg.event.end;
      const studentId = arg.event.extendedProps.studentId as string;

      updateLesson.mutate(
        {
          id: lessonId,
          lesson: {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          },
        },
        {
          onError: () => arg.revert(),
          onSuccess: () => {
            offerApplyToFuture({ studentId, oldStart, oldEnd, newStart, newEnd });
          },
        },
      );
    },
    [updateLesson, offerApplyToFuture],
  );

  const handleLessonResize = useCallback(
    (arg: EventResizeDoneArg) => {
      const lessonId = arg.event.extendedProps.lessonId as string | undefined;
      if (!lessonId || !arg.event.start || !arg.event.end) {
        arg.revert();
        return;
      }
      updateLesson.mutate(
        {
          id: lessonId,
          lesson: {
            startTime: arg.event.start.toISOString(),
            endTime: arg.event.end.toISOString(),
          },
        },
        { onError: () => arg.revert() },
      );
    },
    [updateLesson],
  );

  const handleLessonClick = useCallback(
    (arg: EventClickArg) => {
      const lessonId = arg.event.extendedProps.lessonId as string | undefined;
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      const start = new Date(lesson.startTime);
      const end = new Date(lesson.endTime);
      setLessonDialog({
        mode: 'edit',
        editingId: lesson.id,
        status: lesson.status,
        values: {
          studentId: lesson.studentId,
          date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
          startTime: toHHMM(start),
          endTime: toHHMM(end),
          meetLink: lesson.meetLink ?? '',
          comment: lesson.comment ?? '',
        },
      });
    },
    [lessons],
  );

  const handleLessonSelect = useCallback((arg: DateSelectArg) => {
    const start = arg.start;
    const end = arg.end;
    setLessonDialog({
      mode: 'create',
      values: {
        ...emptyLessonForm,
        date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
        startTime: toHHMM(start),
        endTime: toHHMM(end),
      },
    });
    arg.view.calendar.unselect();
  }, []);

  // ---------- Template-mode handlers ----------

  const handleTemplateDrop = useCallback(
    (arg: EventDropArg) => {
      const id = arg.event.extendedProps.scheduledLessonId as string | undefined;
      if (!id || !arg.event.start || !arg.event.end) {
        arg.revert();
        return;
      }
      const patch: Partial<ScheduledLessonDto> = {
        dayOfWeek: arg.event.start.getDay(),
        startTime: toHHMM(arg.event.start),
        endTime: toHHMM(arg.event.end),
      };
      updateScheduled.mutate({ id, lesson: patch }, { onError: () => arg.revert() });
    },
    [updateScheduled],
  );

  const handleTemplateResize = useCallback(
    (arg: EventResizeDoneArg) => {
      const id = arg.event.extendedProps.scheduledLessonId as string | undefined;
      if (!id || !arg.event.start || !arg.event.end) {
        arg.revert();
        return;
      }
      updateScheduled.mutate(
        {
          id,
          lesson: {
            startTime: toHHMM(arg.event.start),
            endTime: toHHMM(arg.event.end),
          },
        },
        { onError: () => arg.revert() },
      );
    },
    [updateScheduled],
  );

  const handleTemplateClick = useCallback(
    (arg: EventClickArg) => {
      const id = arg.event.extendedProps.scheduledLessonId as string | undefined;
      const sl = scheduledLessons.find((l) => l.id === id);
      if (!sl) return;
      setTemplateDialog({
        mode: 'edit',
        editingId: sl.id,
        values: {
          studentId: sl.studentId,
          dayOfWeek: sl.dayOfWeek,
          startTime: sl.startTime,
          endTime: sl.endTime,
          meetLink: sl.meetLink ?? '',
          comment: sl.comment ?? '',
        },
      });
    },
    [scheduledLessons],
  );

  const handleTemplateSelect = useCallback((arg: DateSelectArg) => {
    setTemplateDialog({
      mode: 'create',
      values: {
        ...emptyTemplateForm,
        dayOfWeek: arg.start.getDay(),
        startTime: toHHMM(arg.start),
        endTime: toHHMM(arg.end),
      },
    });
    arg.view.calendar.unselect();
  }, []);

  // ---------- Shared ----------

  const isLoading = slLoading || studentsLoading || (mode === 'real' && lessonsLoading);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-semibold">Календарь</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as Mode)}
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem value="real" aria-label="Реальные недели">
                Реальные недели
              </ToggleGroupItem>
              <ToggleGroupItem value="template" aria-label="Шаблон">
                Шаблон
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              onClick={() => {
                if (mode === 'real') {
                  const now = new Date();
                  setLessonDialog({
                    mode: 'create',
                    values: {
                      ...emptyLessonForm,
                      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
                    },
                  });
                } else {
                  setTemplateDialog({ mode: 'create', values: emptyTemplateForm });
                }
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/*
          Single info banner under the header, present in both modes so the
          surrounding layout doesn't shift when toggling. Text + the
          mode-specific action (Apply Template) live inside it.
        */}
        <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span>
              {mode === 'real' ? (
                <>
                  <strong>Реальные занятия.</strong> Перетаскивание правит одно занятие; чтобы применить к будущим неделям — нажмите «Применить» в уведомлении после переноса.
                </>
              ) : (
                <>
                  <strong>Редактирование шаблона.</strong> Изменения применятся к новым неделям при их создании и не затронут уже существующие занятия.
                </>
              )}
            </span>
          </div>
          {mode === 'real' ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                if (!visibleRange) return;
                if (scheduledLessons.length === 0) {
                  toast({
                    title: 'Шаблон пустой',
                    description: 'Перейдите в режим «Шаблон» и добавьте занятия',
                    variant: 'destructive',
                  });
                  return;
                }
                setReplaceConfirmOpen(true);
              }}
              disabled={!visibleRange || isReplacing}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Применить шаблон на эту неделю
            </Button>
          ) : null}
        </div>

        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="h-[70vh] grid place-items-center text-muted-foreground">
                Загрузка расписания…
              </div>
            ) : (
              <div className={`calendar-wrapper ${mode === 'template' ? 'calendar-wrapper--template' : ''}`}>
                <FullCalendar
                  key={mode}
                  ref={calendarRef}
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  initialDate={mode === 'template' ? TEMPLATE_ANCHOR : undefined}
                  locale={ruLocale}
                  firstDay={1}
                  allDaySlot={false}
                  slotMinTime="07:00:00"
                  slotMaxTime="23:00:00"
                  slotDuration="00:30:00"
                  slotLabelInterval="01:00:00"
                  nowIndicator={mode === 'real'}
                  height="75vh"
                  expandRows
                  editable
                  selectable
                  selectMirror
                  eventOverlap
                  slotEventOverlap
                  eventResizableFromStart={false}
                  headerToolbar={
                    mode === 'real'
                      ? {
                          left: 'prev,next today',
                          center: 'title',
                          right: 'timeGridWeek,timeGridDay',
                        }
                      : {
                          left: '',
                          center: '',
                          right: '',
                        }
                  }
                  dayHeaderFormat={
                    mode === 'template' ? { weekday: 'long' } : undefined
                  }
                  buttonText={{
                    today: 'Сегодня',
                    week: 'Неделя',
                    day: 'День',
                  }}
                  events={events}
                  datesSet={
                    mode === 'real'
                      ? (arg) => setVisibleRange({ start: arg.start, end: arg.end })
                      : undefined
                  }
                  eventClick={mode === 'real' ? handleLessonClick : handleTemplateClick}
                  eventDrop={mode === 'real' ? handleLessonDrop : handleTemplateDrop}
                  eventResize={mode === 'real' ? handleLessonResize : handleTemplateResize}
                  select={mode === 'real' ? handleLessonSelect : handleTemplateSelect}
                  eventDidMount={(info) => {
                    const props = info.event.extendedProps as {
                      kind?: 'lesson' | 'scheduled';
                      lessonId?: string;
                      scheduledLessonId?: string;
                      studentId?: string;
                    };
                    const onContext = (e: MouseEvent) => {
                      e.preventDefault();
                      if (!props.studentId) return;
                      const target: CtxTarget | null =
                        props.kind === 'lesson' && props.lessonId
                          ? { kind: 'lesson', lessonId: props.lessonId, studentId: props.studentId }
                          : props.kind === 'scheduled' && props.scheduledLessonId
                            ? {
                                kind: 'scheduled',
                                scheduledLessonId: props.scheduledLessonId,
                                studentId: props.studentId,
                              }
                            : null;
                      if (!target) return;
                      setContextMenu({ x: e.clientX, y: e.clientY, target });
                    };
                    info.el.addEventListener('contextmenu', onContext);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <LessonEditDialog
        state={lessonDialog}
        students={students}
        isPending={createLesson.isPending || updateLesson.isPending || deleteLesson.isPending}
        onClose={() => setLessonDialog(null)}
        onSubmit={async (values) => {
          if (!lessonDialog) return;
          const start = new Date(`${values.date}T${values.startTime}:00`);
          const end = new Date(`${values.date}T${values.endTime}:00`);
          if (lessonDialog.mode === 'create') {
            await createLesson.mutateAsync({
              studentId: values.studentId,
              startTime: start,
              endTime: end,
              meetLink: values.meetLink || undefined,
              comment: values.comment || undefined,
              isScheduled: false,
            });
          } else if (lessonDialog.editingId) {
            await updateLesson.mutateAsync({
              id: lessonDialog.editingId,
              lesson: {
                studentId: values.studentId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                meetLink: values.meetLink || null,
                comment: values.comment || null,
              },
            });
          }
          setLessonDialog(null);
        }}
        onDelete={() => {
          if (lessonDialog?.mode === 'edit' && lessonDialog.editingId) {
            deleteLesson.mutate(lessonDialog.editingId);
            setLessonDialog(null);
          }
        }}
      />

      <AlertDialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Применить шаблон на эту неделю?</AlertDialogTitle>
            <AlertDialogDescription>
              Неделя будет пересоздана по текущему шаблону: все плановые занятия этой недели удалятся и заменятся на занятия из шаблона.
              <br />
              <br />
              <strong>Проведённые и активные занятия останутся нетронутыми.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReplacing}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReplacing}
              onClick={async (e) => {
                e.preventDefault();
                if (!visibleRange) return;
                setIsReplacing(true);
                try {
                  const result = await replaceWeek(
                    visibleRange.start,
                    scheduledLessons,
                    lessons,
                  );
                  toast({
                    title: 'Шаблон применён',
                    description: `Удалено: ${result.deleted}, создано: ${result.created}`,
                  });
                  setReplaceConfirmOpen(false);
                } catch (err) {
                  toast({
                    title: 'Ошибка',
                    description:
                      (err as Error)?.message ?? 'Не удалось применить шаблон',
                    variant: 'destructive',
                  });
                } finally {
                  setIsReplacing(false);
                }
              }}
            >
              {isReplacing ? 'Применяем…' : 'Применить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {contextMenu ? (
        <EventContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            const t = contextMenu.target;
            setContextMenu(null);
            if (t.kind === 'lesson') {
              const lesson = lessons.find((l) => l.id === t.lessonId);
              if (lesson) {
                const start = new Date(lesson.startTime);
                const end = new Date(lesson.endTime);
                setLessonDialog({
                  mode: 'edit',
                  editingId: lesson.id,
                  status: lesson.status,
                  values: {
                    studentId: lesson.studentId,
                    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
                    startTime: toHHMM(start),
                    endTime: toHHMM(end),
                    meetLink: lesson.meetLink ?? '',
                    comment: lesson.comment ?? '',
                  },
                });
              }
            } else {
              const sl = scheduledLessons.find((l) => l.id === t.scheduledLessonId);
              if (sl) {
                setTemplateDialog({
                  mode: 'edit',
                  editingId: sl.id,
                  values: {
                    studentId: sl.studentId,
                    dayOfWeek: sl.dayOfWeek,
                    startTime: sl.startTime,
                    endTime: sl.endTime,
                    meetLink: sl.meetLink ?? '',
                    comment: sl.comment ?? '',
                  },
                });
              }
            }
          }}
          onDelete={() => {
            const t = contextMenu.target;
            setContextMenu(null);
            if (t.kind === 'lesson') deleteLesson.mutate(t.lessonId);
            else deleteScheduled.mutate(t.scheduledLessonId);
          }}
          onOpenStudent={() => {
            const sid = contextMenu.target.studentId;
            setContextMenu(null);
            navigate(`/students/${sid}`);
          }}
          onChangeColor={() => {
            const sid = contextMenu.target.studentId;
            setContextMenu(null);
            setColorPickerStudentId(sid);
          }}
        />
      ) : null}

      <ColorPickerDialog
        student={
          colorPickerStudentId ? students.find((s) => s.id === colorPickerStudentId) ?? null : null
        }
        open={!!colorPickerStudentId}
        onOpenChange={(open) => {
          if (!open) setColorPickerStudentId(null);
        }}
        isPending={updateStudent.isPending}
        onSave={async (colorKey) => {
          if (!colorPickerStudentId) return;
          await updateStudent.mutateAsync({
            id: colorPickerStudentId,
            student: { color: colorKey },
          });
          setColorPickerStudentId(null);
        }}
      />

      <TemplateEditDialog
        state={templateDialog}
        students={students}
        isPending={createScheduled.isPending || updateScheduled.isPending || deleteScheduled.isPending}
        onClose={() => setTemplateDialog(null)}
        onSubmit={async (values) => {
          if (!templateDialog) return;
          if (templateDialog.mode === 'create') {
            await createScheduled.mutateAsync({
              studentId: values.studentId,
              dayOfWeek: values.dayOfWeek,
              startTime: values.startTime,
              endTime: values.endTime,
              meetLink: values.meetLink || undefined,
              comment: values.comment || undefined,
            });
          } else if (templateDialog.editingId) {
            await updateScheduled.mutateAsync({
              id: templateDialog.editingId,
              lesson: {
                studentId: values.studentId,
                dayOfWeek: values.dayOfWeek,
                startTime: values.startTime,
                endTime: values.endTime,
                meetLink: values.meetLink || null,
                comment: values.comment || null,
              },
            });
          }
          setTemplateDialog(null);
        }}
        onDelete={() => {
          if (templateDialog?.mode === 'edit' && templateDialog.editingId) {
            deleteScheduled.mutate(templateDialog.editingId);
            setTemplateDialog(null);
          }
        }}
      />
    </div>
  );
}

// ---------- Dialogs ----------

function LessonEditDialog({
  state,
  students,
  isPending,
  onClose,
  onSubmit,
  onDelete,
}: {
  state: LessonDialogState | null;
  students: Student[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormState) => void | Promise<void>;
  onDelete: () => void;
}) {
  const [values, setValues] = useState<LessonFormState>(emptyLessonForm);

  useEffect(() => {
    if (state) setValues(state.values);
  }, [state]);

  const canSave =
    values.studentId.length > 0 &&
    values.date.length > 0 &&
    values.endTime > values.startTime &&
    !isPending;

  // `completed` lessons stay editable: moving them into the future reverts
  // the status to 'planned' and the backend refunds the balance.
  const locked = state?.status === 'active' || state?.status === 'archived';

  return (
    <Dialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === 'create' ? 'Новое занятие' : 'Редактировать занятие'}
          </DialogTitle>
        </DialogHeader>

        {locked ? (
          <div className="rounded-md border border-muted bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Занятие {state?.status === 'active' ? 'идёт сейчас' : 'архивировано'}; редактирование недоступно.
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ученик *</Label>
            <Select
              value={values.studentId}
              onValueChange={(v) => setValues({ ...values, studentId: v })}
              disabled={locked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите ученика" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                value={values.date}
                onChange={(e) => setValues({ ...values, date: e.target.value })}
                disabled={locked}
              />
            </div>
            <div className="space-y-2">
              <Label>Начало</Label>
              <Input
                type="time"
                value={values.startTime}
                onChange={(e) => setValues({ ...values, startTime: e.target.value })}
                disabled={locked}
              />
            </div>
            <div className="space-y-2">
              <Label>Окончание</Label>
              <Input
                type="time"
                value={values.endTime}
                onChange={(e) => setValues({ ...values, endTime: e.target.value })}
                disabled={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ссылка на звонок</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={values.meetLink}
              onChange={(e) => setValues({ ...values, meetLink: e.target.value })}
              disabled={locked}
            />
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              rows={2}
              placeholder="Заметки к занятию"
              value={values.comment}
              onChange={(e) => setValues({ ...values, comment: e.target.value })}
              disabled={locked}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {state?.mode === 'edit' ? (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="button" disabled={!canSave || locked} onClick={() => onSubmit(values)}>
              {state?.mode === 'create' ? 'Добавить' : 'Сохранить'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditDialog({
  state,
  students,
  isPending,
  onClose,
  onSubmit,
  onDelete,
}: {
  state: TemplateDialogState | null;
  students: Student[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateFormState) => void | Promise<void>;
  onDelete: () => void;
}) {
  const [values, setValues] = useState<TemplateFormState>(emptyTemplateForm);

  useEffect(() => {
    if (state) setValues(state.values);
  }, [state]);

  const canSave =
    values.studentId.length > 0 && values.endTime > values.startTime && !isPending;

  return (
    <Dialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === 'create' ? 'Новый шаблон занятия' : 'Редактировать шаблон'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ученик *</Label>
            <Select
              value={values.studentId}
              onValueChange={(v) => setValues({ ...values, studentId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите ученика" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>День недели</Label>
              <Select
                value={String(values.dayOfWeek)}
                onValueChange={(v) => setValues({ ...values, dayOfWeek: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Начало</Label>
              <Input
                type="time"
                value={values.startTime}
                onChange={(e) => setValues({ ...values, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Окончание</Label>
              <Input
                type="time"
                value={values.endTime}
                onChange={(e) => setValues({ ...values, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ссылка на звонок</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={values.meetLink}
              onChange={(e) => setValues({ ...values, meetLink: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              rows={2}
              placeholder="Заметки к занятию"
              value={values.comment}
              onChange={(e) => setValues({ ...values, comment: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {state?.mode === 'edit' ? (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="button" disabled={!canSave} onClick={() => onSubmit(values)}>
              {state?.mode === 'create' ? 'Добавить' : 'Сохранить'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Context menu ----------

function EventContextMenu({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onOpenStudent,
  onChangeColor,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenStudent: () => void;
  onChangeColor: () => void;
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleContext = (e: MouseEvent) => {
      // Close on any right-click outside — another right-click on another
      // event will re-open the menu with fresh coords from eventDidMount.
      if (!(e.target as HTMLElement).closest('.fc-event')) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContext);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContext);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp position so the menu never overflows the viewport.
  const MENU_W = 220;
  const MENU_H = 180;
  const clampedX = Math.min(x, window.innerWidth - MENU_W - 8);
  const clampedY = Math.min(y, window.innerHeight - MENU_H - 8);

  const items: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }> = [
    { label: 'Редактировать', icon: <Edit3 className="w-4 h-4" />, onClick: onEdit },
    { label: 'Перейти на ученика', icon: <UserIcon className="w-4 h-4" />, onClick: onOpenStudent },
    { label: 'Изменить цвет', icon: <Palette className="w-4 h-4" />, onClick: onChangeColor },
    { label: 'Удалить', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, destructive: true },
  ];

  return (
    <div
      role="menu"
      style={{ position: 'fixed', top: clampedY, left: clampedX, zIndex: 80, width: MENU_W }}
      className="rounded-md border bg-popover p-1 shadow-md text-sm"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={item.onClick}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left hover:bg-accent hover:text-accent-foreground ${
            item.destructive ? 'text-destructive hover:text-destructive' : ''
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Color picker ----------

function ColorPickerDialog({
  student,
  open,
  onOpenChange,
  isPending,
  onSave,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSave: (colorKey: string | null) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open && student) {
      setSelected(student.color ?? null);
    }
  }, [open, student]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Цвет занятий{student ? ` — ${getShortName(student.name)}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {Object.entries(COLOR_PRESETS).map(([key, preset]) => {
            const isSelected = selected === key || (selected === null && key === DEFAULT_COLOR_KEY);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                  isSelected ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted'
                }`}
              >
                <span
                  className="inline-block w-5 h-5 rounded"
                  style={{ backgroundColor: preset.bg, borderColor: preset.border, borderWidth: 2 }}
                />
                <span className="text-sm">{preset.label}</span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            disabled={isPending}
          >
            По умолчанию
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button type="button" onClick={() => onSave(selected)} disabled={isPending}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
