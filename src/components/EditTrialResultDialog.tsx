import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdateTrialResult } from '@/hooks/useApi';
import { calculateEgeScores } from '@/api';
import { StudentTrial, TrialResult } from '@/types';

interface EditTrialResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentTrial: StudentTrial | null;
  trialResult: TrialResult | null;
}

export const EditTrialResultDialog: React.FC<EditTrialResultDialogProps> = ({
  open,
  onOpenChange,
  studentTrial,
  trialResult,
}) => {
  const [taskScores, setTaskScores] = useState<number[]>(calculateEgeScores.initializeTaskScores());

  const updateResult = useUpdateTrialResult();

  useEffect(() => {
    if (trialResult?.taskScores && trialResult.taskScores.length > 0) {
      setTaskScores(trialResult.taskScores);
    } else {
      setTaskScores(calculateEgeScores.initializeTaskScores());
    }
  }, [trialResult]);

  const handleScoreChange = (taskIndex: number, score: number) => {
    const newScores = [...taskScores];
    newScores[taskIndex] = score;
    setTaskScores(newScores);
  };

  const primaryScore = calculateEgeScores.calculatePrimaryScore(taskScores);
  const secondaryScore = calculateEgeScores.calculateSecondaryScore(taskScores);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trialResult) {
      return;
    }

    try {
      await updateResult.mutateAsync({
        id: trialResult.id,
        taskScores,
        primaryScore,
        secondaryScore,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Ошибка при обновлении результата пробника:', error);
    }
  };

  if (!studentTrial || !trialResult) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать результат пробника</DialogTitle>
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
              disabled={updateResult.isPending}
            >
              {updateResult.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
