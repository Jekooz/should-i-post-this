'use client';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('flex items-center justify-between rounded-md p-4', {
  variants: {
    variant: {
      success: 'bg-green-100 text-green-600 border border-green-200',
      destructive: 'bg-red-100 text-red-600 border border-red-200',
      warning: 'bg-yellow-100 text-yellow-600 border border-yellow-200',
      info: 'bg-blue-100 text-blue-600 border border-blue-200',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
}

export const Alert = ({ className, variant, ...props }: AlertProps) => (
  <div className={cn(alertVariants({ variant, className }))} {...props} />
);
