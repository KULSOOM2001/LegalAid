import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'brass' | 'danger';

export default function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const map: Record<Variant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    brass: 'btn-brass',
    danger: 'bg-crit text-white px-4 py-2 rounded font-body font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40',
  };
  return (
    <button className={clsx(map[variant], className)} {...props}>
      {children}
    </button>
  );
}
