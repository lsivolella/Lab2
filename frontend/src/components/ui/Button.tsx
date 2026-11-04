import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'dark' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-brand-400 text-ink-900 hover:bg-brand-300',
    dark: 'bg-ink-900 text-cream-50 hover:bg-ink-700',
    ghost: 'bg-transparent text-ink-900 hover:bg-cream-100',
};

export function Button({
    variant = 'primary',
    loading = false,
    disabled,
    className = '',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
            {...props}
        >
            {loading && (
                <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}
            {children}
        </button>
    );
}
