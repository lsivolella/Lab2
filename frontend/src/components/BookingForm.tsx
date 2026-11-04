import { CircleCheck, Landmark } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { translate } from '../api/messages';
import { createOrder } from '../api/orders';
import type { CarResponse } from '../types/car';
import { addDays, daysBetween, formatCurrency, todayIso } from '../utils/dates';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

/**
 * Rental request for one car: dates, optional bank credit and the price
 * summary. The backend recalculates and checks availability on submit.
 * Picking another car keeps the dates and the credit option.
 */
export function BookingForm({ car }: { car: CarResponse }) {
    const today = todayIso();
    const [startDate, setStartDate] = useState(addDays(today, 1));
    const [endDate, setEndDate] = useState(addDays(today, 4));
    const [creditRequested, setCreditRequested] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdId, setCreatedId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [carId, setCarId] = useState(car.id);

    // Another car was picked: clear this car's result and error, keep the rest.
    if (car.id !== carId) {
        setCarId(car.id);
        setCreatedId(null);
        setError(null);
    }

    const days = daysBetween(startDate, endDate);
    const validDates = startDate >= today && days > 0;

    function changeStart(value: string) {
        setStartDate(value);

        // Keep the return date after the pickup date.
        if (value && endDate <= value) {
            setEndDate(addDays(value, 1));
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const order = await createOrder({
                carId: car.id,
                startDate,
                endDate,
                creditRequested,
            });
            setCreatedId(order.id);
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? translate(caught.message)
                    : 'Não foi possível conectar ao servidor.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (createdId !== null) {
        return (
            <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
                <CircleCheck
                    className="mx-auto size-10 text-emerald-600"
                    aria-hidden="true"
                />
                <p className="mt-3 font-semibold text-emerald-900">
                    Pedido #{createdId} enviado!
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                    {creditRequested
                        ? 'Um banco parceiro vai analisar o pedido e o crédito.'
                        : 'A locadora vai analisar o pedido.'}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                    <Link
                        to="/pedidos"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-cream-50 hover:bg-ink-700"
                    >
                        Ver meus pedidos
                    </Link>
                    <Button variant="ghost" onClick={() => setCreatedId(null)}>
                        Fazer outro pedido
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {error && <Alert>{error}</Alert>}

            <div className="grid grid-cols-2 gap-3">
                <TextField
                    label="Retirada"
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(event) => changeStart(event.target.value)}
                />
                <TextField
                    label="Devolução"
                    type="date"
                    min={addDays(startDate || today, 1)}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-200 transition-colors has-checked:bg-brand-400/10 has-checked:ring-brand-400">
                <input
                    type="checkbox"
                    checked={creditRequested}
                    onChange={(event) =>
                        setCreditRequested(event.target.checked)
                    }
                    className="mt-1 size-4 accent-brand-600"
                />
                <span>
                    <span className="flex items-center gap-2 text-sm font-semibold">
                        <Landmark className="size-4" aria-hidden="true" />
                        Solicitar crédito bancário
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                        Um banco parceiro analisa o pedido e define juros e
                        parcelas.
                    </span>
                </span>
            </label>

            <dl className="space-y-2 rounded-2xl bg-cream-50 p-4 text-sm">
                <div className="flex justify-between text-ink-500">
                    <dt>
                        {validDates ? days : 0}{' '}
                        {days === 1 ? 'diária' : 'diárias'} ×{' '}
                        {formatCurrency(car.dailyRate)}
                    </dt>
                </div>
                <div className="flex items-baseline justify-between">
                    <dt className="font-semibold">Total</dt>
                    <dd className="text-xl font-bold">
                        {formatCurrency(validDates ? days * car.dailyRate : 0)}
                    </dd>
                </div>
            </dl>

            <Button
                type="submit"
                loading={submitting}
                disabled={!validDates}
                className="w-full"
            >
                Solicitar aluguel
            </Button>
        </form>
    );
}
