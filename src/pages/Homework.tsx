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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Trash2, Copy, Check, Filter, X, ExternalLink, Search } from "lucide-react";
import { useHomeworks, useDeleteHomework } from "@/hooks/useApi";
import { AddHomeworkDialog } from "@/components/AddHomeworkDialog";
import { EditHomeworkDialog } from "@/components/EditHomeworkDialog";
import { Navigation } from "@/components/Navigation";
import { TaskNumberMultiSelect } from "@/components/TaskNumberMultiSelect";
import { TagPicker } from "@/components/TagPicker";
import { useHomeworkTags, useDeleteHomeworkTag } from "@/hooks/api/tags";
import { Homework } from "@/types";
import { toast } from "@/hooks/use-toast";

export default function Homework() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [homeworkToView, setHomeworkToView] = useState<Homework | null>(null);
  const [copied, setCopied] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskNumbers, setSelectedTaskNumbers] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: homeworks = [], isLoading } = useHomeworks();
  const { data: allTags = [] } = useHomeworkTags();
  const deleteHomework = useDeleteHomework();
  const deleteTag = useDeleteHomeworkTag();

  const filteredHomeworks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return homeworks.filter((homework) => {
      if (q) {
        const haystack = [
          homework.title,
          homework.taskNumber,
          homework.link ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (
        selectedTaskNumbers.length > 0 &&
        !selectedTaskNumbers.includes(homework.taskNumber)
      ) {
        return false;
      }
      if (selectedTagIds.length > 0) {
        const tagIds = new Set(homework.tags?.map((t) => t.id) ?? []);
        if (!selectedTagIds.some((id) => tagIds.has(id))) return false;
      }
      return true;
    });
  }, [homeworks, searchQuery, selectedTaskNumbers, selectedTagIds]);

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedTaskNumbers.length > 0 ? 1 : 0) +
    (selectedTagIds.length > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTaskNumbers([]);
    setSelectedTagIds([]);
  };

  const handleDeleteClick = (homework: Homework) => {
    setHomeworkToDelete(homework);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (homeworkToDelete) {
      try {
        await deleteHomework.mutateAsync(homeworkToDelete.id);
        setDeleteDialogOpen(false);
        setHomeworkToDelete(null);
      } catch (error) {
        // Ошибка обрабатывается в хуке
      }
    }
  };

  const handleViewClick = (homework: Homework) => {
    setHomeworkToView(homework);
    setViewDialogOpen(true);
  };

  const handleCopyTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Скопировано",
        description: "Название домашнего задания скопировано в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clipboard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Домашние задания</h1>
          </div>
          <AddHomeworkDialog />
        </div>

        {/* Панель фильтров */}
        {homeworks.length > 0 && (
          <Card className="mb-6">
            <div className="p-4 pb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Поиск по названию, номеру задачи, ссылке..."
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
                          : 'По номеру задачи и содержимому'}
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

        {/* Список домашних заданий */}
        <Card>
          <CardHeader>
            <CardTitle>Список домашних заданий</CardTitle>
            <CardDescription>
              {filteredHomeworks.length === homeworks.length 
                ? `Всего домашних заданий: ${homeworks.length}`
                : `Найдено: ${filteredHomeworks.length} из ${homeworks.length} домашних заданий`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredHomeworks.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Домашние задания не найдены</h3>
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
                    <TableHead>Название</TableHead>
                    <TableHead>Теги</TableHead>
                    <TableHead>Ссылка</TableHead>
                    <TableHead>Создано</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHomeworks.map((homework) => (
                    <TableRow
                      key={homework.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewClick(homework)}
                    >
                      <TableCell className="font-medium">
                        {homework.taskNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {homework.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(homework.tags ?? []).map((t) => (
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
                        {homework.link ? (
                          <a
                            href={homework.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Открыть
                          </a>
                        ) : (
                          <span className="text-gray-400">Не указано</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {homework.createdAt.toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTitle(homework.title);
                            }}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <EditHomeworkDialog homework={homework} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(homework);
                            }}
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
      </div>

      {/* Диалог удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить домашнее задание?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить домашнее задание "{homeworkToDelete?.title}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог просмотра */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clipboard className="w-5 h-5" />
              {homeworkToView?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Задача №{homeworkToView?.taskNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ссылка на материалы:</h4>
                {homeworkToView?.link ? (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <a
                      href={homeworkToView.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {homeworkToView.link}
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500">Ссылка не указана</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Дата создания:</h4>
                <p className="text-gray-600">
                  {homeworkToView?.createdAt.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Закрыть</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}