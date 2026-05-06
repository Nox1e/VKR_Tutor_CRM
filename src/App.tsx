import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import CalendarPage from './pages/Calendar';
import Preparations from './pages/Preparations';
import Homework from './pages/Homework';
import Trials from './pages/Trials';
import Stats from './pages/Stats';
import Archive from './pages/Archive';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import AppSuspenseFallback from '@/components/AppSuspenseFallback';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppErrorBoundary>
          <AuthProvider>
            <Suspense fallback={<AppSuspenseFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Index />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <RequireAuth>
                      <CalendarPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <RequireAuth>
                      <Students />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/students/:id"
                  element={
                    <RequireAuth>
                      <StudentDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/preparations"
                  element={
                    <RequireAuth>
                      <Preparations />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/homework"
                  element={
                    <RequireAuth>
                      <Homework />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/trials"
                  element={
                    <RequireAuth>
                      <Trials />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <RequireAuth>
                      <Stats />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/archive"
                  element={
                    <RequireAuth>
                      <Archive />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
