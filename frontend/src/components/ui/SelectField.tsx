import { ChevronDown } from 'lucide-react';
import { useId, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: readonly string[];
    placeholder?: string;
}

export function SelectField({
    label,
    error,
    options,
    placeholder = 'Selecione',
    className = '',
    id,
    ...props
}: SelectFieldProps) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label
                htmlFor={selectId}
                className="text-sm font-medium text-ink-700"
            >
                {label}
            </label>
            <div className="relative">
                <select
                    id={selectId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`h-12 w-full appearance-none rounded-2xl border bg-white pr-10 pl-4 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20 ${
                        error ? 'border-red-400' : 'border-cream-200'
                    }`}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                />
            </div>
            {error && (
                <p id={errorId} className="text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
