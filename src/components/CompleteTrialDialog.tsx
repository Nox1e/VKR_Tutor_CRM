import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarkStudentTrialCompleted, useCreateTrialResult, useUpdateTrialResult, useTrialResult } from '@/hooks/useApi';
import { calculateEgeScores } from '@/api';
import { StudentTrial } from '@/types';

interface CompleteTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentTrial: StudentTrial | null;
}

const areScoresEqual = (current: number[], next: number[]) =>
  current.length === next.length && current.every((score, index) => score === next[index]);

export const CompleteTrialDialog: React.FC<CompleteTrialDialogProps> = ({
  open,
  onOpenChange,
  studentTrial,
}) => {
  const initialTaskScores = useMemo(() => calculateEgeScores.initializeTaskScores(), []);
  const [taskScores, setTaskScores] = useState<number[]>(() => initialTaskScores.slice());
  const lastAppliedSourceRef = useRef<string | null>(null);

  const markCompleted = useMarkStudentTrialCompleted();
  const createResult = useCreateTrialResult();
  const updateResult = useUpdateTrialResult();

  const studentTrialId = studentTrial?.id ?? null;
  const { data: existingResult } = useTrialResult(studentTrialId ?? '');

  useEffect(() => {
    if (!open) {
      lastAppliedSourceRef.current = null;
      return;
    }

    if (!studentTrialId) {
      const resetScores = initialTaskScores.slice();
      setTaskScores((prev) => (areScoresEqual(prev, resetScores) ? prev : resetScores));
      lastAppliedSourceRef.current = null;
      return;
    }

    let normalizedScores: number[] | null = null;

    if (existingResult && Array.isArray(existingResult.taskScores)) {
      normalizedScores = existingResult.taskScores.map((score) => {
        const numericScore = Number(score);
        return Number.isFinite(numericScore) ? numericScore : 0;
      });
    }

    const updatedAtKey = existingResult?.updatedAt instanceof Date
      ? existingResult.updatedAt.toISOString()
      : existingResult?.updatedAt ?? '';

    const sourceKey = normalizedScores
      ? `${studentTrialId}:${updatedAtKey}:${normalizedScores.join(',')}`
      : `no-result:${studentTrialId}`;

    if (lastAppliedSourceRef.current === sourceKey) {
      return;
    }

    lastAppliedSourceRef.current = sourceKey;

    if (normalizedScores) {
      const nextScores = normalizedScores.slice();
      setTaskScores((prev) => (areScoresEqual(prev, nextScores) ? prev : nextScores));
    } else {
      const resetScores = initialTaskScores.slice();
      setTaskScores((prev) => (areScoresEqual(prev, resetScores) ? prev : resetScores));
    }
  }, [open, studentTrialId, existingResult, initialTaskScores]);

  const handleScoreChange = (taskIndex: number, score: number) => {
    const newScores = [...taskScores];
    newScores[taskIndex] = score;
    setTaskScores(newScores);
  };

  const primaryScore = calculateEgeScores.calculatePrimaryScore(taskScores);
  const secondaryScore = calculateEgeScores.calculateSecondaryScore(taskScores);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentTrial) {
      return;
    }

    try {
      await markCompleted.mutateAsync(studentTrial.id);

      if (existingResult) {
        await updateResult.mutateAsync({
          id: existingResult.id,
          taskScores,
          primaryScore,
          secondaryScore,
        });
      } else {
        await createResult.mutateAsync({
          studentTrialId: studentTrial.id,
          taskScores,
          primaryScore,
          secondaryScore,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Ошибка при завершении пробника:', error);
    }
  };

  if (!studentTrial) return null;

  const isSubmitting = markCompleted.isPending || createResult.isPending || updateResult.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Завершить пробник</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Пробник</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{studentTrial.trialTitle}</p>
              <p className="text-sm text-muted-foreground">
                {studentTrial.trialDifficultyLevel === 'easy' ? 'Легкий' : 
                 studentTrial.trialDifficultyLevel === 'ege' ? 'Уровень ЕГЭ' : 'Усложненный'}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Оценка по задачам</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {taskScores.map((score, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium">
                      Задача {index + 1}
                      {index >= 25 && <span className="text-muted-foreground ml-1">(0-2)</span>}
                      {index < 25 && <span className="text-muted-foreground ml-1">(0-1)</span>}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={index >= 25 ? 2 : 1}
                      value={score}
                      onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Итоговые результаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Label className="text-sm text-blue-600">Первичный балл</Label>
                  <div className="text-2xl font-bold text-blue-700">{primaryScore}</div>
                  <div className="text-xs text-blue-500">из 29</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Label className="text-sm text-green-600">Вторичный балл</Label>
                  <div className="text-2xl font-bold text-green-700">{secondaryScore}</div>
                  <div className="text-xs text-green-500">из 100</div>
                </div>
              </div>
              
              <div className="text-center">
                <Badge 
                  variant={secondaryScore >= 78 ? "default" : secondaryScore >= 40 ? "secondary" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {secondaryScore >= 78 ? "Отлично" : secondaryScore >= 40 ? "Хорошо" : "Требует улучшения"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Завершить пробник'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
