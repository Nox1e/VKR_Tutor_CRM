import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppState } from '@/types';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataManagerProps {
  appState: AppState;
  onImportData: (data: AppState) => void;
  onClearData: () => void;
}

export function DataManager({ appState, onImportData, onClearData }: DataManagerProps) {
  const { toast } = useToast();

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(appState, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `tutor-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Данные экспортированы",
        description: "Файл сохранен локально на компьютере",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (importedData.students && importedData.lessons) {
          onImportData(importedData);
          toast({
            title: "Данные импортированы",
            description: "Все данные успешно загружены",
          });
        } else {
          throw new Error("Неверный формат файла");
        }
      } catch (error) {
        toast({
          title: "Ошибка импорта",
          description: "Неверный формат файла или поврежденные данные",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
      onClearData();
      toast({
        title: "Данные удалены",
        description: "Все данные успешно удалены",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Управление данными
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Экспортируйте данные для резервного копирования или переноса на другой компьютер.</p>
          <p>Импортируйте ранее сохраненные данные для восстановления.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              Импорт
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </Button>
        </div>
        
        <Button 
          onClick={handleClearData} 
          variant="destructive" 
          size="sm"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Очистить все данные
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>Статистика:</p>
          <p>• Учеников: {appState.students.length}</p>
          <p>• Всего уроков: {appState.lessons.length}</p>
          <p>• Уроков сегодня: {appState.lessons.filter(l => {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
            const lessonDate = new Date(l.startTime);
            return lessonDate >= todayStart && lessonDate < todayEnd;
          }).length}</p>
        </div>
      </CardContent>
    </Card>
  );
}
