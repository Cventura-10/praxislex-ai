import { AIAnalyticsDashboard } from '@/components/analytics/AIAnalyticsDashboard';

export default function AIAnalytics() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold mb-2">Analytics de IA</h1>
        <p className="text-muted-foreground">
          Visualiza y analiza el rendimiento del asistente IA y los patrones de uso
        </p>
      </div>
      <AIAnalyticsDashboard />
    </div>
  );
}
