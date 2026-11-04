import type { ReactNode } from 'react';

/** White card grouping related fields on a 6-column grid. */
export function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-200 sm:p-8">
            <legend className="sr-only">{title}</legend>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-ink-500">{description}</p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-6">{children}</div>
        </fieldset>
    );
}
