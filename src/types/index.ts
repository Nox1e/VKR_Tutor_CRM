export interface Student {
  id: string;
  name: string;
  // Контактная информация
  telegram?: string;
  phone?: string;
  birthDate?: string;
  timezone?: string; // например "МСК+2"
  // Информация о родителе
  parentName?: string;
  parentTelegram?: string;
  parentPhone?: string;
  // Финансовая информация
  hourlyRate?: number;
  lessonsPerMonth?: number;
  lessonDuration?: number; // в минутах
  paymentType?: 'subscription' | 'per-lesson'; // абонемент/по занятиям
  monthlyRevenue?: number;
  acquisitionCost?: number;
  acquisitionSource?: 'profi' | 'avito' | 'referral' | 'word-of-mouth'; // профи/авито/реферал/сарафан
  photoData?: string; // base64 строка с фотографией
  paidLessonsCount?: number; // количество оплаченных занятий
  manualTaskProgress?: number[]; // номера задач, отмеченных вручную (хранится как JSONB)
  learningTrajectory?: string; // JSON строка с массивом ID подготовок
  color?: string; // произвольный CSS-цвет для отображения в календаре
}

export interface TimeInterval {
  id: string;
  startTime: Date;
  endTime?: Date;
}

export interface Lesson {
  id: string;
  studentId: string;
  startTime: Date;
  endTime: Date;
  meetLink?: string;
  comment?: string;
  intervals: TimeInterval[];
  status: 'planned' | 'active' | 'completed' | 'archived';
  isScheduled?: boolean; // Новое поле для плановых занятий
  preparationId?: string; // ID привязанной подготовки
  homeworkId?: string; // ID привязанного домашнего задания
  isPaid?: boolean; // статус оплаты урока
}

export interface ScheduledLesson {
  id: string;
  studentId: string;
  dayOfWeek: number; // 0-6 (воскресенье-суббота)
  startTime: string;
  endTime: string;
  meetLink?: string;
  comment?: string;
  preparationId?: string; // ID привязанной подготовки
  homeworkId?: string; // ID привязанного домашнего задания
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Preparation {
  id: string;
  taskNumber: string; // № задачи, к которой она относится
  method: 'program' | 'analytics' | 'excel'; // метод решения
  title: string; // название подготовки
  message: string; // текст сообщения подготовки
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Homework {
  id: string;
  taskNumber: string; // № задачи, к которой относится ДЗ
  title: string; // название домашнего задания
  link?: string; // ссылка на материалы
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Trial {
  id: string;
  orderNumber: number; // порядковый номер пробника в базе
  difficultyLevel: 'easy' | 'ege' | 'advanced'; // уровень сложности
  title: string; // название пробника
  link: string; // ссылка на пробник
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistory {
  id: string;
  studentId: string;
  lessonsCount: number;
  amount: number;
  createdAt: Date;
}

// Пробник ученика
export interface StudentTrial {
  id: string;
  studentId: string;
  trialId: string; // ID пробника из базы пробников
  deadline: Date; // дедлайн выполнения
  comment?: string; // комментарий к решению
  complications?: string; // усложнения
  status: 'assigned' | 'completed'; // назначен или выполнен
  completedAt?: Date; // дата выполнения
  result?: TrialResult; // результат выполнения
  createdAt: Date;
  updatedAt: Date;
  trialTitle?: string;
  trialLink?: string;
  trialDifficultyLevel?: 'easy' | 'ege' | 'advanced';
}

// Результат выполнения пробника
export interface TrialResult {
  id: string;
  studentTrialId: string;
  taskScores: number[]; // массив из 27 элементов: 0-1 для задач 1-25, 0-2 для задач 26-27
  primaryScore: number; // первичный балл (0-29)
  secondaryScore: number; // вторичный балл (7-100)
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichedTrialResult extends TrialResult {
  studentId?: string;
  completedAt?: Date;
  deadline?: Date;
  trialTitle?: string;
  trialDifficultyLevel?: string;
}

export interface TrajectoryItem {
  id: string;
  studentId: string;
  preparationId: string;
  homeworkId?: string | null;
  position: number;
  status: 'queued' | 'assigned' | 'consumed' | 'skipped';
  assignedToLessonId?: string | null;
  assignedAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  preparationTitle?: string;
  preparationTaskNumber?: string;
  preparationMethod?: string;
  homeworkTitle?: string;
}

export interface AppState {
  students: Student[];
  lessons: Lesson[];
  scheduledLessons: ScheduledLesson[]; // Новое поле для плановых занятий
  preparations: Preparation[]; // Новое поле для подготовок
  homeworks: Homework[]; // Новое поле для домашних заданий
  trials: Trial[]; // Новое поле для пробников
  studentTrials: StudentTrial[]; // Новое поле для пробников учеников
  trialResults: TrialResult[]; // Новое поле для результатов пробников
  paymentHistory: PaymentHistory[]; // Новое поле для истории оплат
  selectedLessonId?: string;
}