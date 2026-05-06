import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Student } from '@/types';
import { Users, Plus, User, Trash2, Camera, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents, useCreateStudent, useDeleteStudent, useLessons } from '@/hooks/useApi';
import { Link } from 'react-router-dom';
import { getShortName } from '@/utils/nameUtils';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Navigation } from '@/components/Navigation';

export default function Students() {
  const [open, setOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhoto, setNewStudentPhoto] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  // Set of student IDs that have a lesson today — O(lessons) once per render
  // instead of O(students × lessons) when auto-materialised planned lessons
  // balloon the `lessons` array.
  const studentsWithTodayLessons = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const ids = new Set<string>();
    for (const lesson of lessons) {
      if (lesson.status === 'archived') continue;
      const t = new Date(lesson.startTime).getTime();
      if (t >= todayStart && t < todayEnd) ids.add(lesson.studentId);
    }
    return ids;
  }, [lessons]);

  const hasTodayLessons = (studentId: string) => studentsWithTodayLessons.has(studentId);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = students.filter((student) => student.name.toLowerCase().includes(query));
    }

    if (studentsWithTodayLessons.size > 0) {
      filtered = [...filtered].sort((a, b) => {
        const aHas = studentsWithTodayLessons.has(a.id);
        const bHas = studentsWithTodayLessons.has(b.id);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });
    }

    return filtered;
  }, [students, searchQuery, studentsWithTodayLessons]);

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    
    const studentData = {
      name: newStudentName.trim(),
      photoData: newStudentPhoto
    };
    
    createStudent.mutate(studentData, {
      onSuccess: () => {
        toast({
          title: "Ученик добавлен",
          description: `${newStudentName} успешно добавлен`,
        });
        setNewStudentName('');
        setNewStudentPhoto(undefined);
        setOpen(false);
      },
      onError: () => {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить ученика",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    deleteStudent.mutate(studentId, {
      onSuccess: () => {
        toast({
          title: "Ученик удален",
          description: `${studentName} удален из системы`,
        });
      },
      onError: () => {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить ученика",
          variant: "destructive",
        });
      }
    });
  };

  if (studentsLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Загружаем учеников...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Ученики</h1>
              <p className="text-muted-foreground">Управление учениками и их информацией</p>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить ученика
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить ученика</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="name">ФИО ученика</Label>
                  <Input
                    id="name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Введите ФИО ученика"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddStudent();
                      }
                    }}
                  />
                </div>
                
                <PhotoUpload
                  value={newStudentPhoto}
                  onChange={setNewStudentPhoto}
                  size="md"
                  showLabel={true}
                  label="Фотография ученика"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleAddStudent}
                    disabled={!newStudentName.trim() || createStudent.isPending}
                  >
                    {createStudent.isPending ? 'Добавление...' : 'Добавить'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Поисковая строка */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск по имени ученика..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Список учеников */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const studentHasTodayLessons = hasTodayLessons(student.id);
            return (
              <Card 
                key={student.id} 
                className={`hover:shadow-lg transition-shadow ${
                  studentHasTodayLessons ? 'ring-2 ring-orange-500 border-orange-200' : ''
                }`}
              >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {student.photoData ? (
                      <img
                        src={student.photoData}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate">{getShortName(student.name)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStudent(student.id, student.name)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link to={`/students/${student.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      Подробнее
                    </Button>
                  </Link>
                </div>
              </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStudents.length === 0 && students.length > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground text-center mb-4">
                По запросу "{searchQuery}" ученики не найдены
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Очистить поиск
              </Button>
            </CardContent>
          </Card>
        )}

        {students.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Учеников нет</h3>
              <p className="text-muted-foreground text-center mb-4">
                Добавьте первого ученика, чтобы начать работу
              </p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить ученика
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}