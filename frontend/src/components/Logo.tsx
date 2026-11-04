import { CarFront } from 'lucide-react';

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
    return (
        <span className="inline-flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-400 text-ink-900">
                <CarFront className="size-5" aria-hidden="true" />
            </span>
            <span
                className={`text-lg font-bold tracking-tight ${
                    tone === 'light' ? 'text-cream-50' : 'text-ink-900'
                }`}
            >
                Rentacar
            </span>
        </span>
    );
}
