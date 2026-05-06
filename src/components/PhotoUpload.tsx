import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function PhotoUpload({ 
  value, 
  onChange, 
  className,
  size = 'md',
  showLabel = true,
  label = 'Фотография'
}: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (width > 600) {
          const scale = 600 / width;
          width = 600;
          height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB');
      return;
    }

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 400, 0.7);
      onChange(compressedDataUrl);
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      alert('Ошибка при обработке изображения');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    onChange(undefined);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            sizeClasses[size],
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50',
            value && 'border-solid border-primary/20'
          )}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isCompressing ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
              <span className="text-xs text-center px-1">
                Сжатие...
              </span>
            </div>
          ) : value ? (
            <>
              <img
                src={value}
                alt="Фотография ученика"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs text-center px-1">
                {size === 'sm' ? 'Фото' : 'Добавить фото'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isCompressing}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isCompressing ? 'Сжатие...' : (value ? 'Изменить' : 'Загрузить')}
          </Button>
          
          {value && !isCompressing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              className="text-destructive hover:text-destructive"
            >
              Удалить
            </Button>
          )}
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Поддерживаются форматы: JPG, PNG, GIF. Максимальный размер: 10MB (сжимается до 400px, качество 70%)
      </p>
    </div>
  );
}
