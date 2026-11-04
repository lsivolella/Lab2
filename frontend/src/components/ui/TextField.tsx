import {
    useId,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
} from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
    /** Element shown inside the input, on the right (e.g. a button). */
    trailing?: ReactNode;
    /** Reaches the <input>, e.g. to move the focus to it. */
    ref?: Ref<HTMLInputElement>;
}

export function TextField({
    label,
    error,
    hint,
    trailing,
    className = '',
    id,
    ref,
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
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={message ? messageId : undefined}
                    className={`h-12 w-full rounded-2xl border bg-white pl-4 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-400 read-only:cursor-default read-only:bg-cream-50 read-only:text-ink-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20 read-only:focus:ring-0 ${
                        trailing ? 'pr-12' : 'pr-4'
                    } ${error ? 'border-red-400' : 'border-cream-200'}`}
                    {...props}
                />
                {trailing && (
                    <div className="absolute inset-y-0 right-1 flex items-center">
                        {trailing}
                    </div>
                )}
            </div>
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
