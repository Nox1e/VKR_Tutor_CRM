import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Wallet, AlarmClock, BellOff, CheckCheck } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/api/notifications';
import type { NotificationDto } from '@shared/api/contracts';

// Icon + colour per notification type. Adding a new type? Just extend this map.
const typeStyles: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  'low-balance': { icon: Wallet, tone: 'text-amber-600 bg-amber-50' },
  'overdue-trial': { icon: AlarmClock, tone: 'text-red-600 bg-red-50' },
};

const defaultStyle = { icon: Bell, tone: 'text-blue-600 bg-blue-50' };

const formatRelative = (iso: string) => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMs = now - t;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} д назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
};

const linkForNotification = (n: NotificationDto): string | null => {
  const studentId = (n.meta as { studentId?: string } | null | undefined)?.studentId;
  if (studentId) return `/students/${studentId}`;
  return null;
};

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({ notification, onMarkRead, onClose }: NotificationItemProps) {
  const style = typeStyles[notification.type] ?? defaultStyle;
  const Icon = style.icon;
  const isUnread = !notification.readAt;
  const target = linkForNotification(notification);

  const handleActivate = () => {
    if (isUnread) onMarkRead(notification.id);
    onClose();
  };

  const body = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors',
        isUnread ? 'bg-primary/[0.04]' : 'bg-transparent',
        target ? 'cursor-pointer hover:bg-muted/60' : '',
      )}
    >
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          style.tone,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', isUnread ? 'font-medium' : '')}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-primary" aria-label="Непрочитанное" />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5">{notification.body}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          {formatRelative(notification.createdAt as unknown as string)}
        </p>
      </div>
    </div>
  );

  if (target) {
    return (
      <Link to={target} onClick={handleActivate} className="block">
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      className="w-full text-left"
      disabled={!isUnread}
    >
      {body}
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data = [], unreadCount, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const hasItems = data.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={
            unreadCount > 0
              ? `Уведомления, непрочитанных: ${unreadCount}`
              : 'Уведомления'
          }
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-[18px] text-center shadow-sm ring-2 ring-background"
              aria-hidden
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea
          type="always"
          className="h-[420px] [&_[data-radix-scroll-area-thumb]]:bg-muted-foreground/40 [&_[data-radix-scroll-area-thumb]]:hover:bg-muted-foreground/60"
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Загрузка…
            </div>
          ) : !hasItems ? (
            <div className="px-4 py-10 text-center">
              <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Уведомлений пока нет</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
