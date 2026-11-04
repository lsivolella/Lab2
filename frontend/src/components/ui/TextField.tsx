import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

export function TextField({
    label,
    error,
    hint,
    className = '',
    id,
    ...props
}: TextFieldProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const message = error ?? hint;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label
                htmlFor={inputId}
                className="text-sm font-medium text-ink-700"
            >
                {label}
            </label>
            <input
                id={inputId}
                aria-invalid={error ? true : undefined}
                aria-describedby={message ? messageId : undefined}
                className={`h-12 rounded-2xl border bg-white px-4 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-400 read-only:cursor-default read-only:bg-cream-50 read-only:text-ink-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20 read-only:focus:ring-0 ${
                    error ? 'border-red-400' : 'border-cream-200'
                }`}
                {...props}
            />
            {message && (
                <p
                    id={messageId}
                    className={`text-xs ${error ? 'text-red-600' : 'text-ink-400'}`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
