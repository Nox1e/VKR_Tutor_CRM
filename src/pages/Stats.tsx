import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Wallet, Trophy, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Navigation } from '@/components/Navigation';
import {
  useStudents,
  usePaymentHistory,
  useEnrichedTrialResults,
  useLessons,
} from '@/hooks/useApi';
import type { PaymentHistory, EnrichedTrialResult, Student, Lesson } from '@/types';

const ALL_STUDENTS = '__all__';
const MONTHS_BACK = 12;

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
};

const buildMonthBuckets = (months: number) => {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
};

const formatRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

interface FinanceMonthRow {
  month: string;
  monthLabel: string;
  amount: number;
  lessons: number;
}

const aggregateFinance = (payments: PaymentHistory[]): FinanceMonthRow[] => {
  const buckets = buildMonthBuckets(MONTHS_BACK);
  const byKey = new Map<string, { amount: number; lessons: number }>();
  buckets.forEach((k) => byKey.set(k, { amount: 0, lessons: 0 }));
  payments.forEach((p) => {
    const k = monthKey(p.createdAt);
    const slot = byKey.get(k);
    if (!slot) return;
    slot.amount += p.amount ?? 0;
    slot.lessons += p.lessonsCount ?? 0;
  });
  return buckets.map((k) => {
    const v = byKey.get(k)!;
    return { month: k, monthLabel: monthLabel(k), amount: v.amount, lessons: v.lessons };
  });
};

interface TrialPoint {
  ts: number;
  date: string;
  primaryScore: number;
  secondaryScore: number;
  count?: number;
  trialTitle?: string;
}

const aggregateTrialsPerCompletion = (results: EnrichedTrialResult[]): TrialPoint[] =>
  results
    .filter((r) => r.completedAt)
    .map((r) => ({
      ts: r.completedAt!.getTime(),
      date: r.completedAt!.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      primaryScore: r.primaryScore,
      secondaryScore: r.secondaryScore,
      trialTitle: r.trialTitle,
    }))
    .sort((a, b) => a.ts - b.ts);

const aggregateTrialsByMonth = (results: EnrichedTrialResult[]): TrialPoint[] => {
  const groups = new Map<string, { primary: number; secondary: number; count: number; ts: number }>();
  results.forEach((r) => {
    if (!r.completedAt) return;
    const k = monthKey(r.completedAt);
    const slot = groups.get(k) ?? { primary: 0, secondary: 0, count: 0, ts: 0 };
    slot.primary += r.primaryScore;
    slot.secondary += r.secondaryScore;
    slot.count += 1;
    slot.ts = Math.max(slot.ts, r.completedAt.getTime());
    groups.set(k, slot);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => ({
      ts: v.ts,
      date: monthLabel(k),
      primaryScore: Math.round((v.primary / v.count) * 10) / 10,
      secondaryScore: Math.round(v.secondary / v.count),
      count: v.count,
    }));
};

interface StudentRevenueRow {
  studentId: string;
  name: string;
  amount: number;
  lessons: number;
}

const aggregateByStudent = (
  payments: PaymentHistory[],
  students: Student[],
): StudentRevenueRow[] => {
  const nameById = new Map(students.map((s) => [s.id, s.name]));
  const groups = new Map<string, { amount: number; lessons: number }>();
  payments.forEach((p) => {
    const slot = groups.get(p.studentId) ?? { amount: 0, lessons: 0 };
    slot.amount += p.amount ?? 0;
    slot.lessons += p.lessonsCount ?? 0;
    groups.set(p.studentId, slot);
  });
  return Array.from(groups.entries())
    .map(([studentId, v]) => ({
      studentId,
      name: nameById.get(studentId) ?? '— удалён —',
      amount: v.amount,
      lessons: v.lessons,
    }))
    .sort((a, b) => b.amount - a.amount);
};

const sumCurrentMonth = (payments: PaymentHistory[]) => {
  const now = new Date();
  const k = monthKey(now);
  return payments.filter((p) => monthKey(p.createdAt) === k).reduce((s, p) => s + (p.amount ?? 0), 0);
};

const sumPrevMonth = (payments: PaymentHistory[]) => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const k = monthKey(prev);
  return payments.filter((p) => monthKey(p.createdAt) === k).reduce((s, p) => s + (p.amount ?? 0), 0);
};

const sumLast12 = (payments: PaymentHistory[]) => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  return payments.filter((p) => p.createdAt >= cutoff).reduce((s, p) => s + (p.amount ?? 0), 0);
};

const averagePerLesson = (payments: PaymentHistory[]) => {
  const totalAmount = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalLessons = payments.reduce((s, p) => s + (p.lessonsCount ?? 0), 0);
  return totalLessons > 0 ? totalAmount / totalLessons : 0;
};

// === Loadout (admin) =======================================================

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface DayLoadRow {
  day: string;
  count: number;
  hours: number;
}

interface HourLoadRow {
  hour: string;
  count: number;
}

const isCountedLesson = (l: Lesson) => l.status === 'completed' || l.status === 'planned';

const aggregateLoadByDay = (lessons: Lesson[]): DayLoadRow[] => {
  const counts = new Array(7).fill(0).map(() => ({ count: 0, minutes: 0 }));
  lessons.filter(isCountedLesson).forEach((l) => {
    const jsDay = l.startTime.getDay(); // 0..6, Sun=0
    const idx = (jsDay + 6) % 7; // shift to Mon..Sun
    counts[idx].count += 1;
    counts[idx].minutes += Math.max(0, (l.endTime.getTime() - l.startTime.getTime()) / 60000);
  });
  return counts.map((v, i) => ({
    day: DAY_LABELS[i],
    count: v.count,
    hours: Math.round((v.minutes / 60) * 10) / 10,
  }));
};

const aggregateLoadByHour = (lessons: Lesson[]): HourLoadRow[] => {
  const counts = new Array(24).fill(0);
  lessons.filter(isCountedLesson).forEach((l) => {
    counts[l.startTime.getHours()] += 1;
  });
  return counts.map((count, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, count }));
};

// === Debtors ===============================================================

interface DebtorRow {
  studentId: string;
  name: string;
  balance: number;
  lastLessonAt: Date | null;
}

const DEBTOR_RECENT_DAYS = 21;

const findDebtors = (students: Student[], lessons: Lesson[]): DebtorRow[] => {
  const cutoff = Date.now() - DEBTOR_RECENT_DAYS * 24 * 60 * 60 * 1000;
  const lastByStudent = new Map<string, number>();
  lessons
    .filter((l) => l.status === 'completed' || l.status === 'planned')
    .forEach((l) => {
      const t = l.startTime.getTime();
      if (t > (lastByStudent.get(l.studentId) ?? 0)) lastByStudent.set(l.studentId, t);
    });
  return students
    .filter((s) => (s.paidLessonsCount ?? 0) <= 0)
    .map((s) => {
      const t = lastByStudent.get(s.id);
      return {
        studentId: s.id,
        name: s.name,
        balance: s.paidLessonsCount ?? 0,
        lastLessonAt: t ? new Date(t) : null,
      };
    })
    .filter((d) => d.lastLessonAt && d.lastLessonAt.getTime() >= cutoff)
    .sort((a, b) => (b.lastLessonAt!.getTime() - a.lastLessonAt!.getTime()));
};

// === ROI ===================================================================

interface RoiRow {
  studentId: string;
  name: string;
  acquisitionCost: number;
  monthlyRevenue: number;
  paybackMonths: number | null;
  roiYear: number | null;
}

const aggregateRoi = (students: Student[]): RoiRow[] =>
  students
    .filter((s) => (s.acquisitionCost ?? 0) > 0 || (s.monthlyRevenue ?? 0) > 0)
    .map((s) => {
      const cost = s.acquisitionCost ?? 0;
      const rev = s.monthlyRevenue ?? 0;
      const payback = cost > 0 && rev > 0 ? cost / rev : null;
      const roiYear = cost > 0 ? ((rev * 12 - cost) / cost) * 100 : null;
      return {
        studentId: s.id,
        name: s.name,
        acquisitionCost: cost,
        monthlyRevenue: rev,
        paybackMonths: payback,
        roiYear,
      };
    })
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

// === Trial heatmap (per-student) ===========================================

interface TaskRateRow {
  taskNumber: string;
  // 0..1 — доля решённых (для 1..25) или средняя нормированная доля (для 26..27)
  rate: number;
  raw: number; // среднее значение taskScores[i]
  max: number; // 1 либо 2
}

const aggregateTaskRates = (results: EnrichedTrialResult[]): TaskRateRow[] => {
  const completed = results.filter((r) => Array.isArray(r.taskScores) && r.taskScores.length === 27);
  const rows: TaskRateRow[] = [];
  for (let i = 0; i < 27; i++) {
    const max = i < 25 ? 1 : 2;
    if (completed.length === 0) {
      rows.push({ taskNumber: String(i + 1), rate: 0, raw: 0, max });
      continue;
    }
    const sum = completed.reduce((s, r) => s + (Number(r.taskScores[i]) || 0), 0);
    const raw = sum / completed.length;
    rows.push({
      taskNumber: String(i + 1),
      rate: max > 0 ? raw / max : 0,
      raw: Math.round(raw * 100) / 100,
      max,
    });
  }
  return rows;
};

const heatmapColor = (rate: number) => {
  // 0 → red, 0.5 → amber, 1 → green. Pure HSL ramp.
  const hue = Math.round(rate * 120); // 0..120
  return `hsl(${hue}, 65%, 50%)`;
};

// === KPI card ==============================================================

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(ALL_STUDENTS);
  const studentFilter = selectedStudentId === ALL_STUDENTS ? undefined : selectedStudentId;

  const { data: students = [] } = useStudents();
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentHistory(studentFilter);
  const { data: trialResults = [], isLoading: trialsLoading } =
    useEnrichedTrialResults(studentFilter);
  const { data: lessons = [] } = useLessons();

  const selectedStudent = useMemo(
    () => (studentFilter ? students.find((s) => s.id === studentFilter) ?? null : null),
    [students, studentFilter],
  );

  const lessonsForLoad = useMemo(
    () => (studentFilter ? lessons.filter((l) => l.studentId === studentFilter) : lessons),
    [lessons, studentFilter],
  );

  const financeRows = useMemo(() => aggregateFinance(payments), [payments]);
  const studentRevenue = useMemo(
    () => (studentFilter ? [] : aggregateByStudent(payments, students)),
    [payments, students, studentFilter],
  );
  const trialPoints = useMemo(
    () =>
      studentFilter
        ? aggregateTrialsPerCompletion(trialResults)
        : aggregateTrialsByMonth(trialResults),
    [trialResults, studentFilter],
  );
  const debtors = useMemo(
    () => (studentFilter ? [] : findDebtors(students, lessons)),
    [students, lessons, studentFilter],
  );
  const roiRows = useMemo(
    () => (studentFilter ? [] : aggregateRoi(students)),
    [students, studentFilter],
  );
  const loadByDay = useMemo(() => aggregateLoadByDay(lessonsForLoad), [lessonsForLoad]);
  const loadByHour = useMemo(() => aggregateLoadByHour(lessonsForLoad), [lessonsForLoad]);
  const taskRates = useMemo(
    () => (studentFilter ? aggregateTaskRates(trialResults) : []),
    [trialResults, studentFilter],
  );

  const totalAcquisition = roiRows.reduce((s, r) => s + r.acquisitionCost, 0);
  const totalMonthlyRevenue = roiRows.reduce((s, r) => s + r.monthlyRevenue, 0);
  const avgPayback =
    totalMonthlyRevenue > 0 ? totalAcquisition / totalMonthlyRevenue : null;

  const manualDoneCount = selectedStudent?.manualTaskProgress?.length ?? 0;

  const kpiCurrent = sumCurrentMonth(payments);
  const kpiPrev = sumPrevMonth(payments);
  const kpiYear = sumLast12(payments);
  const kpiAvg = averagePerLesson(payments);

  const completedTrials = trialResults.filter((r) => r.completedAt).length;
  const avgSecondary =
    completedTrials > 0
      ? Math.round(
          trialResults
            .filter((r) => r.completedAt)
            .reduce((s, r) => s + r.secondaryScore, 0) / completedTrials,
        )
      : 0;
  const bestSecondary = trialResults.reduce((max, r) => Math.max(max, r.secondaryScore), 0);
  const lastResult = trialPoints.length > 0 ? trialPoints[trialPoints.length - 1] : null;

  const isLoading = paymentsLoading || trialsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-semibold">Статистика</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ученик:</span>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Все ученики" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STUDENTS}>Все ученики</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка…</div>
        ) : null}

        <Tabs defaultValue="finance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="finance" className="gap-2">
              <Wallet className="w-4 h-4" />
              Финансы
            </TabsTrigger>
            <TabsTrigger value="trials" className="gap-2">
              <Trophy className="w-4 h-4" />
              Пробники
            </TabsTrigger>
            <TabsTrigger value="load" className="gap-2">
              <Clock className="w-4 h-4" />
              Загрузка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Этот месяц" value={formatRub(kpiCurrent)} />
              <KpiCard label="Прошлый месяц" value={formatRub(kpiPrev)} />
              <KpiCard label="За 12 месяцев" value={formatRub(kpiYear)} />
              <KpiCard
                label="Средний чек за занятие"
                value={formatRub(kpiAvg)}
                hint="Сумма / кол-во занятий по платежам"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Оплаты по месяцам</CardTitle>
                <CardDescription>Сумма поступлений за последние 12 месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}к`} />
                      <Tooltip
                        formatter={(value: number) => formatRub(value)}
                        labelFormatter={(label) => `Месяц: ${label}`}
                      />
                      <Bar dataKey="amount" name="Сумма" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {!studentFilter ? (
              <Card>
                <CardHeader>
                  <CardTitle>Выручка по ученикам</CardTitle>
                  <CardDescription>Суммарные поступления за всё время, по каждому ученику</CardDescription>
                </CardHeader>
                <CardContent>
                  {studentRevenue.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      Пока нет оплат
                    </div>
                  ) : (
                    <div
                      className="w-full"
                      style={{ height: Math.max(240, studentRevenue.length * 32 + 40) }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={studentRevenue}
                          layout="vertical"
                          margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => `${v / 1000}к`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            width={140}
                          />
                          <Tooltip formatter={(value: number) => formatRub(value)} />
                          <Bar
                            dataKey="amount"
                            name="Выручка"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Оплаченные занятия по месяцам</CardTitle>
                <CardDescription>Динамика количества занятий, оплаченных в каждом месяце</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financeRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(label) => `Месяц: ${label}`} />
                      <Line
                        type="monotone"
                        dataKey="lessons"
                        name="Занятий"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {!studentFilter ? (
              <Card>
                <CardHeader>
                  <CardTitle>Должники</CardTitle>
                  <CardDescription>
                    Ученики с балансом ≤ 0, у которых было занятие за последние {DEBTOR_RECENT_DAYS} дней
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {debtors.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-6 text-center">
                      Все активные ученики оплачены — ничего не требуется
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ученик</TableHead>
                          <TableHead className="text-right">Баланс</TableHead>
                          <TableHead>Последнее занятие</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtors.map((d) => (
                          <TableRow key={d.studentId}>
                            <TableCell className="font-medium">{d.name}</TableCell>
                            <TableCell className="text-right text-destructive">{d.balance}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {d.lastLessonAt
                                ? d.lastLessonAt.toLocaleDateString('ru-RU')
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {!studentFilter && roiRows.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>ROI на привлечение</CardTitle>
                  <CardDescription>
                    Стоимость привлечения и месячная выручка по каждому ученику. Окупаемость —
                    сколько месяцев работы покрывают вложения; ROI за год — прибыль за 12 месяцев,
                    нормированная на стоимость привлечения.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard
                      label="Всего вложено"
                      value={formatRub(totalAcquisition)}
                      hint="Сумма acquisition_cost по ученикам"
                    />
                    <KpiCard
                      label="Месячная выручка"
                      value={formatRub(totalMonthlyRevenue)}
                      hint="Сумма monthly_revenue по ученикам"
                    />
                    <KpiCard
                      label="Средняя окупаемость"
                      value={
                        avgPayback !== null
                          ? `${(Math.round(avgPayback * 10) / 10).toString()} мес.`
                          : '—'
                      }
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ученик</TableHead>
                        <TableHead className="text-right">Привлечение</TableHead>
                        <TableHead className="text-right">Выручка/мес</TableHead>
                        <TableHead className="text-right">Окупаемость</TableHead>
                        <TableHead className="text-right">ROI год</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roiRows.map((r) => (
                        <TableRow key={r.studentId}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-right">{formatRub(r.acquisitionCost)}</TableCell>
                          <TableCell className="text-right">{formatRub(r.monthlyRevenue)}</TableCell>
                          <TableCell className="text-right">
                            {r.paybackMonths !== null
                              ? `${(Math.round(r.paybackMonths * 10) / 10).toString()} мес.`
                              : '—'}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              r.roiYear !== null && r.roiYear < 0 ? 'text-destructive' : ''
                            }`}
                          >
                            {r.roiYear !== null ? `${Math.round(r.roiYear)}%` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="trials" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Завершено пробников" value={String(completedTrials)} />
              <KpiCard label="Средний вторичный балл" value={String(avgSecondary)} />
              <KpiCard label="Лучший вторичный балл" value={String(bestSecondary)} />
              <KpiCard
                label="Последний результат"
                value={lastResult ? `${lastResult.secondaryScore}` : '—'}
                hint={lastResult ? `${lastResult.date} · первичный ${lastResult.primaryScore}/29` : undefined}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Динамика баллов</CardTitle>
                <CardDescription>
                  {studentFilter
                    ? 'Вторичный и первичный балл по дате завершения пробника'
                    : 'Усреднено по всем ученикам — показывает общий тренд'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trialPoints.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    Нет завершённых пробников
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trialPoints} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          yAxisId="secondary"
                          tick={{ fontSize: 12 }}
                          domain={[0, 100]}
                          label={{ value: 'Вторичный', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="primary"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          domain={[0, 29]}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="secondary"
                          type="monotone"
                          dataKey="secondaryScore"
                          name="Вторичный балл"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          yAxisId="primary"
                          type="monotone"
                          dataKey="primaryScore"
                          name="Первичный балл"
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {studentFilter ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Слабые задания</CardTitle>
                    <CardDescription>
                      Средняя доля решённости по каждому из 27 заданий. Зелёное — стабильно решается,
                      красное — проседает. Задания 26 и 27 нормированы (макс. 2 балла).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {taskRates.length === 0 || trialResults.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        Нет результатов пробников
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-9 sm:grid-cols-14 gap-1">
                          {taskRates.map((t) => (
                            <div
                              key={t.taskNumber}
                              title={`№${t.taskNumber}: ${Math.round(t.rate * 100)}% (среднее ${t.raw}/${t.max})`}
                              className="rounded-md text-[11px] font-medium text-white text-center py-2"
                              style={{ backgroundColor: heatmapColor(t.rate) }}
                            >
                              {t.taskNumber}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                          <span>0%</span>
                          <div
                            className="h-2 flex-1 rounded"
                            style={{
                              background:
                                'linear-gradient(to right, hsl(0,65%,50%), hsl(60,65%,50%), hsl(120,65%,50%))',
                            }}
                          />
                          <span>100%</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Прогресс ЕГЭ</CardTitle>
                    <CardDescription>
                      Сколько из 27 заданий отмечено пройденными вручную в карточке ученика
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-semibold">
                        {manualDoneCount}
                        <span className="text-base text-muted-foreground"> / 27</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((manualDoneCount / 27) * 100)}%
                      </div>
                    </div>
                    <Progress value={(manualDoneCount / 27) * 100} />
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="load" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Загрузка по дням недели</CardTitle>
                <CardDescription>
                  Количество занятий (запланированных и завершённых) по дням недели
                  {studentFilter ? ' выбранного ученика' : ' всех учеников'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loadByDay} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number, name) =>
                          name === 'Часов' ? `${value} ч` : `${value}`
                        }
                      />
                      <Legend />
                      <Bar dataKey="count" name="Занятий" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hours" name="Часов" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Загрузка по часам</CardTitle>
                <CardDescription>
                  Распределение начала занятий по часам суток (локальное время)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loadByHour} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Занятий" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
