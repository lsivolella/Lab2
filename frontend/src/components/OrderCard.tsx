import {
    ArrowRight,
    FileSignature,
    Landmark,
    MessageSquareText,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { translate } from '../api/messages';
import { cancelOrder, updateOrder } from '../api/orders';
import type { OwnershipType, RentalOrderResponse } from '../types/order';
import type { UserResponse } from '../types/user';
import {
    addDays,
    daysBetween,
    formatCurrency,
    formatDate,
    todayIso,
} from '../utils/dates';
import { agentPermissions } from '../utils/permissions';
import { ContractForm, EvaluationForm } from './AgentOrderActions';
import { CarImage } from './CarImage';
import { StatusBadge } from './StatusBadge';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

const OWNERSHIP_LABEL: Record<OwnershipType, string> = {
    CUSTOMER: 'Cliente',
    COMPANY: 'Locadora',
    BANK: 'Banco',
};

interface OrderCardProps {
    order: RentalOrderResponse;
    /** Logged-in user: decides which actions are offered. */
    viewer: UserResponse;
    onChange: (order: RentalOrderResponse) => void;
}

type Panel = 'none' | 'evaluate' | 'contract';

/**
 * One order. Customers change dates or cancel while it is under analysis;
 * agents evaluate it and execute the contract (see agentPermissions).
 */
export function OrderCard({ order, viewer, onChange }: OrderCardProps) {
    const [editing, setEditing] = useState(false);
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [panel, setPanel] = useState<Panel>('none');
    const [startDate, setStartDate] = useState(order.startDate);
    const [endDate, setEndDate] = useState(order.endDate);
    const [creditRequested, setCreditRequested] = useState(
        order.creditRequested,
    );
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const isCustomer = viewer.role === 'CUSTOMER';
    const permissions = viewer.agent
        ? agentPermissions(order, viewer.agent)
        : null;
    const canChange = isCustomer && order.status === 'SUBMITTED';
    const today = todayIso();
    const newDays = daysBetween(startDate, endDate);

    async function run(action: () => Promise<RentalOrderResponse>) {
        setError(null);
        setBusy(true);

        try {
            onChange(await action());
            setEditing(false);
            setConfirmingCancel(false);
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? translate(caught.message)
                    : 'Não foi possível conectar ao servidor.',
            );
        } finally {
            setBusy(false);
        }
    }

    function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        run(() =>
            updateOrder(order.id, {
                carId: order.car.id,
                startDate,
                endDate,
                creditRequested,
            }),
        );
    }

    return (
        <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-cream-200 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
                <CarImage
                    car={order.car}
                    className="aspect-[16/10] w-full shrink-0 rounded-2xl sm:w-44"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-medium text-ink-500">
                                Pedido #{order.id}
                                {!isCustomer && ` · ${order.customer.name}`}
                            </p>
                            <h2 className="text-lg font-semibold">
                                {order.car.brand} {order.car.model}
                            </h2>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-ink-700">
                        {formatDate(order.startDate)}
                        <ArrowRight
                            className="size-3.5 text-ink-400"
                            aria-hidden="true"
                        />
                        {formatDate(order.endDate)}
                        <span className="text-ink-400">
                            · {order.days}{' '}
                            {order.days === 1 ? 'diária' : 'diárias'}
                        </span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold">
                            {formatCurrency(order.totalAmount)}
                        </span>
                        {order.creditRequested && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                                <Landmark
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Com crédito bancário
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {(order.agentOpinion || order.creditContract || order.contract) && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {order.agentOpinion && (
                        <section className="rounded-2xl bg-cream-50 p-4 text-sm">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <MessageSquareText
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Parecer
                            </h3>
                            <p className="mt-1 text-ink-700">
                                {order.agentOpinion}
                            </p>
                            {order.evaluatedBy && (
                                <p className="mt-2 text-xs text-ink-500">
                                    {order.evaluatedBy.name}
                                    {order.evaluatedAt &&
                                        ` · ${formatDate(order.evaluatedAt)}`}
                                </p>
                            )}
                        </section>
                    )}
                    {order.creditContract && (
                        <section className="rounded-2xl bg-cream-50 p-4 text-sm">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <Landmark
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Crédito
                            </h3>
                            <p className="mt-1 text-ink-700">
                                {order.creditContract.installments}×{' '}
                                {formatCurrency(
                                    order.creditContract.installmentAmount,
                                )}
                            </p>
                            <p className="mt-2 text-xs text-ink-500">
                                {order.creditContract.bank.name} ·{' '}
                                {order.creditContract.monthlyInterestRate}% a.m.
                            </p>
                        </section>
                    )}
                    {order.contract && (
                        <section className="rounded-2xl bg-ink-900 p-4 text-sm text-cream-50">
                            <h3 className="flex items-center gap-2 font-semibold text-brand-400">
                                <FileSignature
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Contrato
                            </h3>
                            <p className="mt-1">
                                Registrado em nome de:{' '}
                                {order.contract.owner.name} (
                                {OWNERSHIP_LABEL[order.contract.ownershipType]})
                            </p>
                            <p className="mt-2 text-xs text-ink-400">
                                Assinado em{' '}
                                {formatDate(order.contract.signedAt)}
                            </p>
                        </section>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-4">
                    <Alert>{error}</Alert>
                </div>
            )}

            {permissions?.waitingFor && (
                <p className="mt-4 rounded-2xl bg-cream-50 px-4 py-3 text-sm text-ink-500">
                    {permissions.waitingFor}
                </p>
            )}

            {panel === 'evaluate' && permissions?.canEvaluate && (
                <EvaluationForm
                    order={order}
                    onDone={(updated) => {
                        setPanel('none');
                        onChange(updated);
                    }}
                    onClose={() => setPanel('none')}
                />
            )}

            {panel === 'contract' && permissions?.canContract && (
                <ContractForm
                    order={order}
                    onDone={(updated) => {
                        setPanel('none');
                        onChange(updated);
                    }}
                    onClose={() => setPanel('none')}
                />
            )}

            {panel === 'none' &&
                (permissions?.canEvaluate || permissions?.canContract) && (
                    <div className="mt-4 flex justify-end">
                        {permissions.canEvaluate ? (
                            <Button onClick={() => setPanel('evaluate')}>
                                Avaliar pedido
                            </Button>
                        ) : (
                            <Button
                                variant="dark"
                                onClick={() => setPanel('contract')}
                            >
                                Executar contrato
                            </Button>
                        )}
                    </div>
                )}

            {canChange && editing && (
                <form
                    className="mt-4 grid gap-3 rounded-2xl bg-cream-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                    onSubmit={handleSave}
                    noValidate
                >
                    <TextField
                        label="Retirada"
                        type="date"
                        min={today}
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                    <TextField
                        label="Devolução"
                        type="date"
                        min={addDays(startDate || today, 1)}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditing(false)}
                        >
                            Voltar
                        </Button>
                        <Button
                            type="submit"
                            loading={busy}
                            disabled={startDate < today || newDays <= 0}
                        >
                            Salvar
                        </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm sm:col-span-3">
                        <input
                            type="checkbox"
                            checked={creditRequested}
                            onChange={(event) =>
                                setCreditRequested(event.target.checked)
                            }
                            className="size-4 accent-brand-600"
                        />
                        Solicitar crédito bancário
                    </label>
                </form>
            )}

            {canChange && !editing && (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {confirmingCancel ? (
                        <>
                            <span className="self-center text-sm text-ink-700">
                                Cancelar este pedido?
                            </span>
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmingCancel(false)}
                            >
                                Não
                            </Button>
                            <Button
                                variant="dark"
                                loading={busy}
                                onClick={() => run(() => cancelOrder(order.id))}
                            >
                                Sim, cancelar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className="ring-1 ring-cream-200"
                                onClick={() => setConfirmingCancel(true)}
                            >
                                Cancelar pedido
                            </Button>
                            <Button
                                variant="dark"
                                onClick={() => setEditing(true)}
                            >
                                Alterar pedido
                            </Button>
                        </>
                    )}
                </div>
            )}
        </article>
    );
}
