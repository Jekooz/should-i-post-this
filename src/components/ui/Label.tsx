'use client';
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn('text-sm font-medium text-foreground', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';
