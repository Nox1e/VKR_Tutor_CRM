import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Student, TrajectoryItem } from '@/types';
import {
  usePreparations,
  useTrajectory,
  useAddTrajectoryItem,
  useRemoveTrajectoryItem,
  useReorderTrajectory,
} from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Search, Plus, Trash2, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';

interface LearningTrajectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
}

const methodColors: Record<string, string> = {
  program: 'bg-blue-100 text-blue-800',
  analytics: 'bg-green-100 text-green-800',
  excel: 'bg-purple-100 text-purple-800',
};

const methodLabels: Record<string, string> = {
  program: 'Программирование',
  analytics: 'Аналитика',
  excel: 'Excel',
};

const statusLabels: Record<string, string> = {
  queued: 'В очереди',
  assigned: 'Назначена',
  consumed: 'Выполнена',
  skipped: 'Пропущена',
};

const statusColors: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  consumed: 'bg-green-100 text-green-700',
  skipped: 'bg-yellow-100 text-yellow-700',
};

export const LearningTrajectoryDialog: React.FC<LearningTrajectoryDialogProps> = ({
  open,
  onOpenChange,
  student,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: preparations = [], isLoading: prepsLoading } = usePreparations();
  const { data: trajectoryItems = [], isLoading: trajectoryLoading } = useTrajectory(student.id);
  const addItemMutation = useAddTrajectoryItem();
  const removeItemMutation = useRemoveTrajectoryItem();
  const reorderMutation = useReorderTrajectory();

  const isLoading = prepsLoading || trajectoryLoading;

  // Active items (queued + assigned) for display and reordering
  const activeItems = useMemo(
    () => trajectoryItems.filter(item => item.status === 'queued' || item.status === 'assigned'),
    [trajectoryItems],
  );

  // IDs already in trajectory (any status) to exclude from "add" list
  const trajectoryPrepIds = useMemo(
    () => new Set(activeItems.map(item => item.preparationId)),
    [activeItems],
  );

  const filteredPreparations = preparations.filter(prep =>
    !trajectoryPrepIds.has(prep.id) && (
      prep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prep.taskNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAdd = (prepId: string) => {
    addItemMutation.mutate({ studentId: student.id, preparationId: prepId });
  };

  const handleRemove = (item: TrajectoryItem) => {
    removeItemMutation.mutate({ studentId: student.id, itemId: item.id });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;

    const newOrder = [...activeItems];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    reorderMutation.mutate({
      studentId: student.id,
      orderedIds: newOrder.map(item => item.id),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5" />
            Образовательная траектория: {student.name}
          </DialogTitle>
          <DialogDescription>
            Запланируйте последовательность подготовок. Верхняя подготовка будет автоматически назначена на следующий урок.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          {/* Текущая траектория */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <Label className="text-base font-semibold">План обучения ({activeItems.length})</Label>
            <ScrollArea className="flex-1 border rounded-lg p-2 bg-gray-50/50">
              {activeItems.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>Траектория пуста. Добавьте подготовки из списка справа.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeItems.map((item, index) => (
                    <div key={item.id} className="p-3 border bg-white rounded-lg shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-primary bg-primary/10 w-5 h-5 flex items-center justify-center rounded-full">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-sm line-clamp-1">{item.preparationTitle ?? item.preparationId}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.preparationTaskNumber && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                №{item.preparationTaskNumber}
                              </Badge>
                            )}
                            {item.preparationMethod && (
                              <Badge className={cn("text-[10px] py-0 h-4", methodColors[item.preparationMethod] ?? '')}>
                                {methodLabels[item.preparationMethod] ?? item.preparationMethod}
                              </Badge>
                            )}
                            <Badge className={cn("text-[10px] py-0 h-4", statusColors[item.status])}>
                              {statusLabels[item.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0 || item.status === 'assigned'}
                            onClick={() => handleMove(index, 'up')}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === activeItems.length - 1 || item.status === 'assigned'}
                            onClick={() => handleMove(index, 'down')}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Выбор подготовок */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <Label className="text-base font-semibold">Добавить в план</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск подготовок..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="flex-1 border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredPreparations.map((prep) => (
                    <div
                      key={prep.id}
                      className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors group"
                      onClick={() => handleAdd(prep.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{prep.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">№{prep.taskNumber}</span>
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">
                              {methodLabels[prep.method]}
                            </Badge>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
