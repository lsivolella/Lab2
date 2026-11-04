import { Building2, CalendarDays, Hash, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCars } from '../api/cars';
import { BookingForm } from '../components/BookingForm';
import { CarImage } from '../components/CarImage';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import type { CarResponse } from '../types/car';
import { formatCurrency } from '../utils/dates';

function CarCard({
    car,
    selected,
    onSelect,
}: {
    car: CarResponse;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`flex flex-col rounded-3xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-600 ${
                selected ? 'ring-2 ring-brand-400' : 'ring-1 ring-cream-200'
            }`}
        >
            <CarImage car={car} className="aspect-[16/10] w-full rounded-2xl" />
            <div className="flex flex-1 items-end justify-between gap-3 px-2 pt-4 pb-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-500">
                        {car.brand} · {car.year}
                    </p>
                    <p className="truncate font-semibold">{car.model}</p>
                </div>
                <p className="shrink-0 text-right">
                    <span className="font-bold">
                        {formatCurrency(car.dailyRate)}
                    </span>
                    <span className="text-xs text-ink-500">/dia</span>
                </p>
            </div>
        </button>
    );
}

function CarDetails({ car, canBook }: { car: CarResponse; canBook: boolean }) {
    const specs = [
        { icon: CalendarDays, label: 'Ano', value: String(car.year) },
        { icon: Hash, label: 'Placa', value: car.plate },
        { icon: Building2, label: 'Locadora', value: car.owner.name },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
                <CarImage
                    car={car}
                    className="aspect-[2/1] w-full rounded-2xl"
                />
                <div className="flex items-end justify-between gap-3 px-2 pt-4 pb-1">
                    <div>
                        <p className="text-sm text-ink-500">{car.brand}</p>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {car.model}
                        </h2>
                    </div>
                    <p className="text-right">
                        <span className="text-xl font-bold">
                            {formatCurrency(car.dailyRate)}
                        </span>
                        <span className="text-sm text-ink-500">/dia</span>
                    </p>
                </div>
            </div>

            <div className="rounded-3xl bg-ink-900 p-5 text-cream-50">
                <h3 className="text-sm font-semibold text-ink-400">
                    Visão geral
                </h3>
                <dl className="mt-3 grid grid-cols-3 gap-2">
                    {specs.map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="rounded-2xl bg-ink-800 p-3 ring-1 ring-ink-700"
                        >
                            <dt className="flex items-center gap-1.5 text-xs text-ink-400">
                                <Icon className="size-3.5" aria-hidden="true" />
                                {label}
                            </dt>
                            <dd className="mt-1 truncate text-sm font-semibold">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>

                {canBook && (
                    <div className="mt-5 rounded-3xl bg-white p-4 text-ink-900">
                        {/* key: start a fresh form when another car is picked */}
                        <BookingForm key={car.id} car={car} />
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Fleet: customers search, pick a car and request a rental; agents see the
 * same catalog without the booking form.
 */
export function CarsPage() {
    const { user } = useAuth();
    const [cars, setCars] = useState<CarResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const detailsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        fetchCars()
            .then((page) => setCars(page.content))
            .catch(() => setError('Não foi possível carregar os carros.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return term
            ? cars.filter((car) =>
                  `${car.brand} ${car.model}`.toLowerCase().includes(term),
              )
            : cars;
    }, [cars, query]);

    const selected =
        cars.find((car) => car.id === selectedId) ?? filtered[0] ?? null;

    function select(car: CarResponse) {
        setSelectedId(car.id);

        // On narrow screens the details are below the list.
        if (window.matchMedia('(max-width: 1279px)').matches) {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    const isCustomer = user?.role === 'CUSTOMER';

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <section className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight">
                    {isCustomer ? 'Encontre seu carro' : 'Frota'}
                    <span className="text-brand-400">.</span>
                </h1>

                <label className="relative mt-6 block">
                    <span className="sr-only">Buscar por marca ou modelo</span>
                    <Search
                        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por marca ou modelo"
                        className="h-12 w-full rounded-full border border-cream-200 bg-white pr-4 pl-11 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20"
                    />
                </label>

                {error && (
                    <div className="mt-6">
                        <Alert>{error}</Alert>
                    </div>
                )}

                {!loading && !error && (
                    <p className="mt-6 text-sm text-ink-500">
                        {filtered.length}{' '}
                        {filtered.length === 1
                            ? 'carro disponível'
                            : 'carros disponíveis'}
                    </p>
                )}

                <div className="mt-3 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {loading &&
                        Array.from({ length: 6 }, (_, index) => (
                            <div
                                key={index}
                                className="h-64 animate-pulse rounded-3xl bg-white/60"
                            />
                        ))}
                    {filtered.map((car) => (
                        <CarCard
                            key={car.id}
                            car={car}
                            selected={car.id === selected?.id}
                            onSelect={() => select(car)}
                        />
                    ))}
                </div>
            </section>

            {/* Sticky and capped to the screen height, scrolling inside if needed. */}
            <aside
                ref={detailsRef}
                className="xl:sticky xl:top-6 xl:max-h-[calc(100svh-3rem)] xl:self-start xl:overflow-y-auto xl:rounded-3xl"
            >
                {selected && <CarDetails car={selected} canBook={isCustomer} />}
            </aside>
        </div>
    );
}
