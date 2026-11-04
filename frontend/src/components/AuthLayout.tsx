import { BadgeCheck, CalendarCheck, Landmark } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';

const FEATURES = [
    {
        icon: CalendarCheck,
        title: 'Pedidos pela internet',
        text: 'Escolha o carro, as datas e acompanhe o status do pedido.',
    },
    {
        icon: BadgeCheck,
        title: 'Análise pelos agentes',
        text: 'Empresas avaliam cada pedido antes do contrato.',
    },
    {
        icon: Landmark,
        title: 'Crédito bancário',
        text: 'Financie o aluguel com um dos bancos parceiros.',
    },
];

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    /** Wider form area, for the registration form. */
    wide?: boolean;
}

/**
 * Split screen for login and registration: a dark brand panel (hidden on
 * small screens) next to the form.
 */
export function AuthLayout({
    title,
    subtitle,
    children,
    wide,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Sticky, so long forms scroll while the brand panel stays put. */}
            <aside className="relative hidden overflow-hidden bg-ink-900 p-12 text-cream-50 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-between">
                <div
                    className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-brand-400/25 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-brand-600/20 blur-3xl"
                    aria-hidden="true"
                />

                <Logo tone="light" />

                <div className="relative">
                    <h1 className="text-4xl leading-tight font-bold tracking-tight">
                        Encontre o carro certo
                        <span className="text-brand-400">.</span>
                        <br />
                        Alugue sem complicação.
                    </h1>
                    <ul className="mt-10 space-y-6">
                        {FEATURES.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex gap-4">
                                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink-700 text-brand-400">
                                    <Icon
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <span>
                                    <span className="block font-semibold">
                                        {title}
                                    </span>
                                    <span className="text-sm text-ink-400">
                                        {text}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-ink-400">
                    Sistema de Aluguel de Carros · PUC Minas
                </p>
            </aside>

            <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
                    <div className="mb-8 lg:hidden">
                        <Logo />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                </div>
            </main>
        </div>
    );
}
