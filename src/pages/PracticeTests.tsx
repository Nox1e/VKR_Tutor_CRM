import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PracticeTests() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Пробники</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Раздел в разработке</CardTitle>
          <CardDescription>
            Здесь будут размещены пробные тесты и экзамены
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            В этом разделе будут доступны:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Пробные ЕГЭ</li>
            <li>Пробные ОГЭ</li>
            <li>Тесты по темам</li>
            <li>Диагностические работы</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

