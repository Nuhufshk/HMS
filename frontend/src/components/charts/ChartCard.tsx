import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  height?: number;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, actions, height = 260, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
