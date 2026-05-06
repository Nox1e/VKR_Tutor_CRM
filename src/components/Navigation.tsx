import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CalendarDays, Users, Home, BookOpen, BarChart3, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthProvider';
import { NotificationBell } from '@/components/NotificationBell';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      href: '/',
      label: 'Занятия',
      icon: Calendar,
    },
    {
      href: '/calendar',
      label: 'Календарь',
      icon: CalendarDays,
    },
    {
      href: '/students',
      label: 'Ученики',
      icon: Users,
    },
    {
      href: '/stats',
      label: 'Статистика',
      icon: BarChart3,
    },
  ];

  const knowledgeBaseItems = [
    {
      href: '/preparations',
      label: 'Подготовки',
    },
    {
      href: '/homework',
      label: 'Домашние задания',
    },
    {
      href: '/trials',
      label: 'Пробники',
    },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Система обучения</span>
          </div>
          
          <div className="flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* База знаний с выпадающим меню */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    knowledgeBaseItems.some(item => location.pathname === item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  База знаний
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {knowledgeBaseItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "w-full",
                        location.pathname === item.href && "bg-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user ? <NotificationBell /> : null}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm gap-2">
                    {user.email}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {user.role}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}