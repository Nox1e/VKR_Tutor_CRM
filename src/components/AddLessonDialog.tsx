import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Student } from '@/types';
import { addMinutes, isValidUrl } from '@/utils/timeUtils';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getShortName } from '@/utils/nameUtils';

interface AddLessonDialogProps {
  students: Student[];
  onAddLesson: (lesson: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
  }) => void;
  onAddStudent: (name: string) => string;
}

export function AddLessonDialog({ students, onAddLesson, onAddStudent }: AddLessonDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [comment, setComment] = useState('');
  const [showNewStudent, setShowNewStudent] = useState(false);

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);
      const end = addMinutes(start, 120);
      setEndTime(end.toTimeString().substring(0, 5));
    }
  };

  const validateForm = () => {
    if (!startTime || !endTime) return false;
    if (!selectedStudentId && !newStudentName.trim()) return false;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    return endDate > startDate;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    let studentId = selectedStudentId;

    if (!selectedStudentId && newStudentName.trim()) {
      try {
        studentId = onAddStudent(newStudentName.trim());
        setSelectedStudentId(studentId);

        setTimeout(() => {
          createLesson(studentId);
        }, 100);
        return;
      } catch (error) {
        console.error('Failed to add student:', error);
        return;
      }
    }
    
    if (!studentId) {
      console.error('No student ID available');
      return;
    }
    
    createLesson(studentId);
  };

  const createLesson = (studentId: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    try {
      onAddLesson({
        studentId,
        startTime: startDate,
        endTime: endDate,
        meetLink: meetLink.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      setSelectedStudentId('');
      setNewStudentName('');
      setStartTime('');
      setEndTime('');
      setMeetLink('');
      setComment('');
      setShowNewStudent(false);
      setOpen(false);
    } catch (error) {
      console.error('Failed to add lesson:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Добавить урок
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить новый урок</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ученик</Label>
            {!showNewStudent ? (
              <div className="flex gap-2">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите ученика" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {getShortName(student.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowNewStudent(true)}
                >
                  Новый
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Имя нового ученика"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewStudent(false);
                    setNewStudentName('');
                  }}
                >
                  Отмена
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Время начала</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Время окончания</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

                      <div className="space-y-2">
              <Label htmlFor="meetLink">Ссылка на звонок (необязательно)</Label>
              <Input
                id="meetLink"
                placeholder="https://..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className={cn(
                  meetLink && !isValidUrl(meetLink) ? "border-warning" : ""
                )}
              />
              {meetLink && !isValidUrl(meetLink) && (
                <p className="text-sm text-warning">Введите корректную ссылку</p>
              )}
            </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Textarea
              id="comment"
              placeholder="Дополнительные заметки к уроку"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!validateForm()}>
              Добавить урок
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}