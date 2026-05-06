import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Trash2, Copy, Check, Filter, X, Search } from "lucide-react";
import { usePreparations, useDeletePreparation } from "@/hooks/useApi";
import { AddPreparationDialog } from "@/components/AddPreparationDialog";
import { EditPreparationDialog } from "@/components/EditPreparationDialog";
import { Navigation } from "@/components/Navigation";
import { TaskNumberMultiSelect } from "@/components/TaskNumberMultiSelect";
import { TagPicker } from "@/components/TagPicker";
import { usePreparationTags, useDeletePreparationTag } from "@/hooks/api/tags";
import { Preparation } from "@/types";
import { toast } from "@/hooks/use-toast";

const methodLabels = {
  program: 'Программа',
  analytics: 'Аналитика',
  excel: 'Excel',
};

const methodColors = {
  program: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  analytics: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  excel: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
};

export default function Preparations() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [preparationToDelete, setPreparationToDelete] = useState<Preparation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [preparationToView, setPreparationToView] = useState<Preparation | null>(null);
  const [copied, setCopied] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskNumbers, setSelectedTaskNumbers] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: preparations = [], isLoading } = usePreparations();
  const { data: allTags = [] } = usePreparationTags();
  const deletePreparation = useDeletePreparation();
  const deleteTag = useDeletePreparationTag();

  const handleDeleteClick = (preparation: Preparation) => {
    setPreparationToDelete(preparation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (preparationToDelete) {
      try {
        await deletePreparation.mutateAsync(preparationToDelete.id);
        setDeleteDialogOpen(false);
        setPreparationToDelete(null);
      } catch (error) {
        // Ошибка обрабатывается в хуке
      }
    }
  };

  const handleViewClick = (preparation: Preparation) => {
    setPreparationToView(preparation);
    setViewDialogOpen(true);
  };

  const handleCopyText = async () => {
    if (preparationToView?.message) {
      try {
        await navigator.clipboard.writeText(preparationToView.message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Текст скопирован",
          description: "Текст подготовки скопирован в буфер обмена",
        });
      } catch (err) {
        console.error('Ошибка копирования:', err);
        toast({
          title: "Ошибка копирования",
          description: "Не удалось скопировать текст",
          variant: "destructive",
        });
      }
    }
  };

  const handleMethodToggle = (method: string) => {
    setSelectedMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTaskNumbers([]);
    setSelectedMethods([]);
    setSelectedTagIds([]);
  };

  const filteredPreparations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return preparations.filter((preparation) => {
      if (q) {
        const haystack = [
          preparation.title,
          preparation.taskNumber,
          preparation.message,
          methodLabels[preparation.method] ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (
        selectedTaskNumbers.length > 0 &&
        !selectedTaskNumbers.includes(preparation.taskNumber)
      ) {
        return false;
      }
      if (
        selectedMethods.length > 0 &&
        !selectedMethods.includes(preparation.method)
      ) {
        return false;
      }
      if (selectedTagIds.length > 0) {
        const tagIds = new Set(preparation.tags?.map((t) => t.id) ?? []);
        if (!selectedTagIds.some((id) => tagIds.has(id))) return false;
      }
      return true;
    });
  }, [preparations, searchQuery, selectedTaskNumbers, selectedMethods, selectedTagIds]);

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedTaskNumbers.length > 0 ? 1 : 0) +
    (selectedMethods.length > 0 ? 1 : 0) +
    (selectedTagIds.length > 0 ? 1 : 0);

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Подготовки</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Загрузка подготовок...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Подготовки</h1>
        </div>
        <AddPreparationDialog />
      </div>

      {/* Панель фильтров */}
      {preparations.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Поиск по названию, номеру задачи, тексту подготовки..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Очистить поиск"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-t">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Фильтры</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeFilterCount > 0
                        ? `Активных фильтров: ${activeFilterCount}`
                        : 'По номеру задачи и методу решения'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllFilters();
                      }}
                      className="h-8 px-2"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Очистить
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-6">
                {/* Фильтр по номерам задач */}
                <div>
                  <h4 className="font-medium mb-3">Номера задач ЕГЭ</h4>
                  <TaskNumberMultiSelect
                    selected={selectedTaskNumbers}
                    onChange={setSelectedTaskNumbers}
                  />
                </div>

                {/* Фильтр по методам */}
                <div>
                  <h4 className="font-medium mb-3">Методы решения</h4>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(methodLabels).map(([method, label]) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox
                          id={`method-${method}`}
                          checked={selectedMethods.includes(method)}
                          onCheckedChange={() => handleMethodToggle(method)}
                        />
                        <label
                          htmlFor={`method-${method}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          <Badge className={`${methodColors[method as keyof typeof methodColors]} border`}>
                            {label}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Фильтр по тегам */}
                <div>
                  <h4 className="font-medium mb-3">Теги</h4>
                  <TagPicker
                    variant="filter"
                    allTags={allTags}
                    selectedIds={selectedTagIds}
                    onChange={setSelectedTagIds}
                    emptyAllLabel="Все теги"
                    onDelete={(id) => deleteTag.mutateAsync(id)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {preparations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Подготовки не найдены</CardTitle>
            <CardDescription>
              Создайте первую подготовку для учеников
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Подготовка - это задание, которое ученик делает перед занятием. 
              Она включает в себя шаблонное сообщение с ссылками на видео и прикрепленные файлы с задачами.
            </p>
            <AddPreparationDialog />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список подготовок</CardTitle>
            <CardDescription>
              {filteredPreparations.length === preparations.length 
                ? `Всего подготовок: ${preparations.length}`
                : `Найдено: ${filteredPreparations.length} из ${preparations.length} подготовок`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPreparations.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Подготовки не найдены</h3>
                <p className="text-muted-foreground mb-4">
                  Попробуйте изменить фильтры или очистить их
                </p>
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="mx-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Очистить фильтры
                </Button>
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ задачи</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Теги</TableHead>
                  <TableHead>Создано</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreparations.map((preparation) => (
                  <TableRow
                    key={preparation.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewClick(preparation)}
                  >
                    <TableCell className="font-medium">
                      {preparation.taskNumber}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${methodColors[preparation.method]} border transition-colors`}>
                        {methodLabels[preparation.method]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {preparation.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(preparation.tags ?? []).map((t) => (
                          <Badge
                            key={t.id}
                            variant="secondary"
                            className="text-xs font-normal"
                            style={t.color ? { backgroundColor: t.color, color: '#fff' } : undefined}
                          >
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {preparation.createdAt.toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div 
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditPreparationDialog preparation={preparation} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(preparation)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить подготовку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить подготовку "{preparationToDelete?.title}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог просмотра */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="max-w-5xl max-h-[85vh] p-0 overflow-hidden">
          {/* Заголовок с градиентом */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <AlertDialogTitle className="text-2xl font-bold text-foreground leading-tight">
                    {preparationToView?.title}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground">
                    Подготовка к задаче №{preparationToView?.taskNumber}
                  </AlertDialogDescription>
                </div>
                <Badge 
                  className={`${preparationToView ? methodColors[preparationToView.method] : ''} text-sm px-3 py-1.5 font-medium shadow-sm border transition-colors`}
                >
                  {preparationToView ? methodLabels[preparationToView.method] : ''}
                </Badge>
              </div>
            </AlertDialogHeader>
          </div>

          {/* Основной контент */}
          <div className="p-6 space-y-6">
            {/* Панель с текстом подготовки */}
            <div className="relative bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border/50 shadow-sm overflow-hidden">
              {/* Заголовок панели */}
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-foreground">
                    Текст подготовки
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyText}
                  className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Контент панели */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono bg-muted/30 p-4 rounded-lg border border-border/30">
                  {preparationToView?.message}
                </div>
              </div>
            </div>
          </div>

          {/* Футер */}
          <div className="bg-muted/20 p-6 border-t border-border/30">
            <AlertDialogFooter className="justify-end">
              <AlertDialogCancel className="px-6 py-2.5 font-medium">
                Закрыть
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
