'use client';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const alertVariants = cva(
  'flex w-full items-start gap-3 rounded-lg border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        success: 'border-success/30 bg-success/10 text-foreground [&>svg]:text-success',
        destructive:
          'border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive',
        warning: 'border-amber-500/30 bg-amber-500/10 text-foreground [&>svg]:text-amber-600',
        info: 'border-border bg-secondary text-foreground [&>svg]:text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const icons = {
  success: CheckCircle2,
  destructive: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Alert({ className, variant = 'info', title, description, children, ...props }: AlertProps) {
  const Icon = icons[variant as keyof typeof icons] ?? Info;
  return (
    <div role={variant === 'destructive' ? 'alert' : 'status'} className={cn(alertVariants({ variant, className }))} {...props}>
      <Icon aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium leading-snug">{title}</p>}
        {description && <p className="mt-0.5 text-muted-foreground">{description}</p>}
        {children}
      </div>
    </div>
  );
}
