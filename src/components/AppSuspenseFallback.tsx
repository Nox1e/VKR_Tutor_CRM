export const AppSuspenseFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
      <p className="text-muted-foreground">Загружаем данные...</p>
    </div>
  </div>
);

export default AppSuspenseFallback;
