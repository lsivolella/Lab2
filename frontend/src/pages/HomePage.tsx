import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABEL = {
    CUSTOMER: 'Cliente',
    AGENT: 'Agente',
} as const;

/** Temporary landing page after login; becomes the dashboard next. */
export function HomePage() {
    const { user, logout } = useAuth();
    const [leaving, setLeaving] = useState(false);

    if (!user) {
        return null;
    }

    async function handleLogout() {
        setLeaving(true);
        await logout();
    }

    return (
        <div className="min-h-svh px-4 py-6 sm:px-8">
            <header className="mx-auto flex max-w-6xl items-center justify-between">
                <Logo />
                <Button variant="dark" loading={leaving} onClick={handleLogout}>
                    <LogOut className="size-4" aria-hidden="true" />
                    Sair
                </Button>
            </header>

            <main className="mx-auto mt-16 max-w-6xl">
                <span className="inline-flex rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-brand-400">
                    {ROLE_LABEL[user.role]}
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight">
                    Olá, {user.name.split(' ')[0]}
                    <span className="text-brand-400">.</span>
                </h1>
                <p className="mt-2 text-ink-500">
                    Você está conectado como {user.email}.
                </p>
            </main>
        </div>
    );
}
