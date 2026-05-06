import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { BookOpen, Trash2, Copy, Check, Filter, X, ExternalLink, Edit } from "lucide-react";
import { useTrials, useDeleteTrial } from "@/hooks/useApi";
import { AddTrialDialog } from "@/components/AddTrialDialog";
import { EditTrialDialog } from "@/components/EditTrialDialog";
import { Navigation } from "@/components/Navigation";
import { TagPicker } from "@/components/TagPicker";
import { useTrialTags, useDeleteTrialTag } from "@/hooks/api/tags";
import { Trial } from "@/types";
import { toast } from "@/hooks/use-toast";

const difficultyLevelLabels = {
  easy: 'Легкий',
  ege: 'Уровень ЕГЭ',
  advanced: 'Усложненный'
};

const difficultyLevelColors = {
  easy: 'bg-green-100 text-green-800',
  ege: 'bg-blue-100 text-blue-800',
  advanced: 'bg-red-100 text-red-800'
};

export default function Trials() {
  const { data: trials = [], isLoading } = useTrials();
  const deleteTrial = useDeleteTrial();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [copied, setCopied] = useState(false);
  const [filters, setFilters] = useState<{
    difficultyLevels: string[];
  }>({
    difficultyLevels: []
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: allTags = [] } = useTrialTags();
  const deleteTag = useDeleteTrialTag();

  const handleEdit = (trial: Trial) => {
    setSelectedTrial(trial);
    setEditDialogOpen(true);
  };

  const handleDelete = (trial: Trial) => {
    setSelectedTrial(trial);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTrial) {
      deleteTrial.mutate(selectedTrial.id);
      setDeleteDialogOpen(false);
      setSelectedTrial(null);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Скопировано",
        description: "Ссылка на пробник скопирована в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive",
      });
    }
  };

  const toggleDifficultyFilter = (difficulty: string) => {
    setFilters(prev => ({
      ...prev,
      difficultyLevels: prev.difficultyLevels.includes(difficulty)
        ? prev.difficultyLevels.filter(d => d !== difficulty)
        : [...prev.difficultyLevels, difficulty]
    }));
  };

  const clearFilters = () => {
    setFilters({
      difficultyLevels: []
    });
    setSelectedTagIds([]);
  };

  const filteredTrials = trials.filter(trial => {
    if (filters.difficultyLevels.length > 0 && !filters.difficultyLevels.includes(trial.difficultyLevel)) {
      return false;
    }
    if (selectedTagIds.length > 0) {
      const tagIds = new Set(trial.tags?.map((t) => t.id) ?? []);
      if (!selectedTagIds.some((id) => tagIds.has(id))) return false;
    }
    return true;
  });

  const activeFilterCount =
    (filters.difficultyLevels.length > 0 ? 1 : 0) +
    (selectedTagIds.length > 0 ? 1 : 0);

  const sortedTrials = [...filteredTrials].sort((a, b) => a.orderNumber - b.orderNumber);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Загрузка пробников...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Пробники</h1>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            Добавить пробник
          </Button>
        </div>

        {/* Панель фильтров */}
        {trials.length > 0 && (
          <Card className="mb-6">
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Фильтры</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeFilterCount > 0
                          ? `Активных фильтров: ${activeFilterCount}`
                          : 'По уровню сложности и тегам'}
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
                          clearFilters();
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
                  <div>
                    <h4 className="font-medium mb-3">Уровень сложности</h4>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(difficultyLevelLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`difficulty-${key}`}
                            checked={filters.difficultyLevels.includes(key)}
                            onCheckedChange={() => toggleDifficultyFilter(key)}
                          />
                          <label
                            htmlFor={`difficulty-${key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Список пробников</CardTitle>
            <CardDescription>
              {sortedTrials.length === trials.length 
                ? `Всего пробников: ${trials.length}`
                : `Найдено: ${sortedTrials.length} из ${trials.length} пробников`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>

            {sortedTrials.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Пробники не найдены</h3>
                <p className="text-muted-foreground mb-4">
                  Попробуйте изменить фильтры или очистить их
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mx-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Очистить фильтры
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Теги</TableHead>
                      <TableHead>Ссылка</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTrials.map((trial) => (
                      <TableRow key={trial.id}>
                        <TableCell className="font-medium">
                          {trial.orderNumber}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${difficultyLevelColors[trial.difficultyLevel]} border transition-colors`}>
                            {difficultyLevelLabels[trial.difficultyLevel]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {trial.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {(trial.tags ?? []).map((t) => (
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
                          <div className="flex items-center gap-2">
                            <a
                              href={trial.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                            >
                              {trial.link}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(trial.link)}
                              className="h-6 w-6 p-0"
                            >
                              {copied ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(trial.link, '_blank')}
                              className="h-6 w-6 p-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trial)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(trial)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AddTrialDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />

        <EditTrialDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          trial={selectedTrial}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пробник</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить пробник "{selectedTrial?.title}"? 
                Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
