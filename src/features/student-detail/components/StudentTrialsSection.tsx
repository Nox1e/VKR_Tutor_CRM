import { Calendar, Check, Copy, Edit, FileText, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StudentTrial, TrialResult } from '@/types';

interface StudentTrialsSectionProps {
  isLoading: boolean;
  nextTrial: StudentTrial | null;
  completedTrials: StudentTrial[];
  onAddTrialClick: () => void;
  onEditTrial: (trial: StudentTrial) => void;
  onCompleteTrial: (trial: StudentTrial) => void;
  onCopyTrial: (trial: StudentTrial) => void;
  onEditTrialResult: (trial: StudentTrial) => void;
  onDeleteTrial: (trialId: string) => void;
  getTrialNumber: (trial: StudentTrial) => number;
  isDeadlineOverdue: (deadline: Date) => boolean;
  trialResults: Record<string, TrialResult | undefined>;
}

export const StudentTrialsSection = ({
  isLoading,
  nextTrial,
  completedTrials,
  onAddTrialClick,
  onEditTrial,
  onCompleteTrial,
  onCopyTrial,
  onEditTrialResult,
  onDeleteTrial,
  getTrialNumber,
  isDeadlineOverdue,
  trialResults,
}: StudentTrialsSectionProps) => (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Пробники
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Загружаем пробники...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {nextTrial && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Следующий запланированный пробник
              </h3>
              <div
                className={`${
                  isDeadlineOverdue(nextTrial.deadline)
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                } border rounded-lg p-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-sm font-medium ${
                          isDeadlineOverdue(nextTrial.deadline)
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}
                      >
                        Пробник #{getTrialNumber(nextTrial)}: {nextTrial.trialTitle}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar
                          className={`w-4 h-4 ${
                            isDeadlineOverdue(nextTrial.deadline)
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        />
                        <span
                          className={
                            isDeadlineOverdue(nextTrial.deadline)
                              ? 'text-red-800'
                              : 'text-blue-800'
                          }
                        >
                          Дедлайн: {format(new Date(nextTrial.deadline), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTrial(nextTrial)}
                        className="h-8 px-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCopyTrial(nextTrial)}
                        className="h-8 px-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onCompleteTrial(nextTrial)}
                        className="h-8 px-2"
                      >
                        <Check className="w-4 h-4" />
                        Выполнен
                      </Button>
                    </div>
                  </div>
                  {nextTrial.comment && (
                    <div
                      className={`text-sm ${
                        isDeadlineOverdue(nextTrial.deadline)
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}
                    >
                      <strong>Комментарий:</strong> {nextTrial.comment}
                    </div>
                  )}
                  {nextTrial.complications && (
                    <div
                      className={`text-sm ${
                        isDeadlineOverdue(nextTrial.deadline)
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}
                    >
                      <strong>Усложнения:</strong> {nextTrial.complications}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Выполненные пробники ({completedTrials.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddTrialClick}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить пробник
              </Button>
            </div>

            {completedTrials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Пробников пока не было</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTrials.map((trial) => {
                  const result = trialResults[trial.id];

                  return (
                    <div key={trial.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-800">
                              Пробник #{getTrialNumber(trial)}: {trial.trialTitle}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-600" />
                              <span className="text-xs text-gray-800">
                                Выполнен:{' '}
                                {format(new Date(trial.completedAt ?? trial.createdAt), 'd MMMM yyyy', {
                                  locale: ru,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditTrial(trial)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditTrialResult(trial)}
                              className="h-6 w-6 p-0"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteTrial(trial.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {result && (
                          <div className="text-xs text-gray-600">
                            <strong>Результат:</strong>{' '}
                            {result.primaryScore} первичных / {result.secondaryScore} вторичных баллов
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
