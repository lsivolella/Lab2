import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
    return (
        <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
            />
            <span>{children}</span>
        </div>
    );
}
