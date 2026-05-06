import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, Calendar, DollarSign, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PaymentHistory } from '@/types';

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  paymentHistory: PaymentHistory[];
  onDeletePayment: (paymentId: string) => void;
  isLoading?: boolean;
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  studentId,
  paymentHistory,
  onDeletePayment,
  isLoading = false
}: PaymentHistoryDialogProps) {
  const sortedHistory = [...paymentHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const totalLessons = paymentHistory.reduce((sum, payment) => sum + payment.lessonsCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            История оплат
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Всего занятий</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{totalLessons}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Общая сумма</span>
              </div>
              <div className="text-2xl font-bold text-green-800">{totalAmount} ₽</div>
            </div>
          </div>

          {/* Список записей */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Загрузка истории оплат...</div>
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <History className="w-12 h-12 mb-4 opacity-50" />
                <p>История оплат пуста</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(payment.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {payment.lessonsCount} занятий
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold text-green-600">
                            {payment.amount} ₽
                          </div>
                          <div className="text-sm text-gray-500">
                            {Math.round(payment.amount / payment.lessonsCount)} ₽ за занятие
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePayment(payment.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Кнопка закрытия */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
