import {
    CarFront,
    ClipboardList,
    LogOut,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { UserResponse } from '../types/user';

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

/** Menu of each kind of user: customer, company agent or bank agent. */
function navItems(user: UserResponse): NavItem[] {
    if (user.role === 'CUSTOMER') {
        return [
            { to: '/carros', label: 'Carros', icon: CarFront },
            { to: '/pedidos', label: 'Meus pedidos', icon: ClipboardList },
            { to: '/perfil', label: 'Meu perfil', icon: UserRound },
        ];
    }

    return [
        { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
        // Banks evaluate credit; only companies have a fleet.
        ...(user.agent?.type === 'COMPANY'
            ? [{ to: '/carros', label: 'Minha frota', icon: CarFront }]
            : []),
        { to: '/perfil', label: 'Minha conta', icon: UserRound },
    ];
}

function userLabel(user: UserResponse): string {
    if (user.role === 'CUSTOMER') {
        return 'Cliente';
    }

    return user.agent?.type === 'BANK' ? 'Banco' : 'Locadora';
}

function navClass({ isActive }: { isActive: boolean }) {
    return `group relative grid size-12 place-items-center rounded-2xl transition-colors ${
        isActive
            ? 'bg-brand-400 text-ink-900'
            : 'text-ink-500 hover:bg-cream-100 hover:text-ink-900'
    }`;
}

/**
 * Shell of the logged-in area: icon sidebar (bottom bar on phones), a top bar
 * with the user, and the current page.
 */
export function AppLayout() {
    const { user, logout } = useAuth();
    const [leaving, setLeaving] = useState(false);

    if (!user) {
        return null;
    }

    async function handleLogout() {
        setLeaving(true);
        await logout();
    }

    const items = navItems(user);

    return (
        <div className="min-h-svh lg:flex lg:gap-6 lg:p-6">
            <nav
                aria-label="Navegação principal"
                className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-cream-200 bg-white px-4 py-2 lg:sticky lg:top-6 lg:h-[calc(100svh-3rem)] lg:w-20 lg:flex-col lg:items-center lg:justify-start lg:gap-3 lg:rounded-3xl lg:border-0 lg:py-6 lg:shadow-sm"
            >
                <span className="mb-4 hidden size-12 place-items-center rounded-2xl bg-ink-900 text-brand-400 lg:grid">
                    <CarFront className="size-5" aria-hidden="true" />
                </span>
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={navClass}
                        title={label}
                    >
                        <Icon className="size-5" aria-hidden="true" />
                        <span className="sr-only">{label}</span>
                    </NavLink>
                ))}
                <button
                    type="button"
                    title="Sair"
                    disabled={leaving}
                    onClick={handleLogout}
                    className="grid size-12 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 lg:mt-auto"
                >
                    <LogOut className="size-5" aria-hidden="true" />
                    <span className="sr-only">Sair</span>
                </button>
            </nav>

            <div className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:p-0">
                <header className="mb-6 flex items-center justify-end gap-3">
                    <div className="text-right">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-ink-500">
                            {userLabel(user)}
                        </p>
                    </div>
                    <span
                        className="grid size-11 place-items-center rounded-full bg-ink-900 font-semibold text-brand-400"
                        aria-hidden="true"
                    >
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                </header>
                <Outlet />
            </div>
        </div>
    );
}
