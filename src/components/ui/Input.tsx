'use client';
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn('border border-input rounded-md bg-background p-2 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
