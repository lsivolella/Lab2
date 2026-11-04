import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { translate } from '../api/messages';
import { evaluateOrder, executeContract } from '../api/orders';
import type { OwnershipType, RentalOrderResponse } from '../types/order';
import { installmentAmount } from '../utils/credit';
import { formatCurrency } from '../utils/dates';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

interface ActionProps {
    order: RentalOrderResponse;
    onDone: (order: RentalOrderResponse) => void;
    onClose: () => void;
}

function useAction(onDone: ActionProps['onDone']) {
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function run(action: () => Promise<RentalOrderResponse>) {
        setError(null);
        setBusy(true);

        try {
            onDone(await action());
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

    return { error, busy, run };
}

function Choice<T extends string | boolean>({
    name,
    value,
    current,
    label,
    description,
    onSelect,
}: {
    name: string;
    value: T;
    current: T;
    label: string;
    description?: string;
    onSelect: (value: T) => void;
}) {
    return (
        <label className="flex flex-1 cursor-pointer flex-col rounded-2xl bg-white p-3 ring-1 ring-cream-200 transition-colors has-checked:ring-2 has-checked:ring-brand-400">
            <span className="flex items-center gap-2 text-sm font-semibold">
                <input
                    type="radio"
                    name={name}
                    checked={current === value}
                    onChange={() => onSelect(value)}
                    className="accent-brand-600"
                />
                {label}
            </span>
            {description && (
                <span className="mt-1 pl-5 text-xs text-ink-500">
                    {description}
                </span>
            )}
        </label>
    );
}

export function EvaluationForm({ order, onDone, onClose }: ActionProps) {
    const name = useId();
    const opinionId = useId();
    const [approved, setApproved] = useState(true);
    const [opinion, setOpinion] = useState('');
    const [rate, setRate] = useState('1.99');
    const [installments, setInstallments] = useState('12');
    const { error, busy, run } = useAction(onDone);

    const grantsCredit = order.creditRequested && approved;
    const rateValue = Number(rate);
    const installmentsValue = Number(installments);
    const validCredit =
        rate !== '' &&
        rateValue >= 0 &&
        rateValue <= 20 &&
        Number.isInteger(installmentsValue) &&
        installmentsValue >= 1 &&
        installmentsValue <= 60;
    const canSubmit =
        opinion.trim().length > 0 && (!grantsCredit || validCredit);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        run(() =>
            evaluateOrder(order.id, {
                approved,
                opinion: opinion.trim(),
                credit: grantsCredit
                    ? {
                          monthlyInterestRate: rateValue,
                          installments: installmentsValue,
                      }
                    : undefined,
            }),
        );
    }

    return (
        <form
            className="mt-4 space-y-4 rounded-2xl bg-cream-50 p-4"
            onSubmit={handleSubmit}
            noValidate
        >
            <h3 className="font-semibold">Análise financeira</h3>
            {error && <Alert>{error}</Alert>}

            <div className="flex flex-col gap-2 sm:flex-row">
                <Choice
                    name={name}
                    value={true}
                    current={approved}
                    label="Aprovar"
                    description={
                        order.creditRequested
                            ? 'Concede o crédito e libera o contrato.'
                            : 'Libera o pedido para o contrato.'
                    }
                    onSelect={setApproved}
                />
                <Choice
                    name={name}
                    value={false}
                    current={approved}
                    label="Recusar"
                    description="Encerra o pedido."
                    onSelect={setApproved}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor={opinionId}
                    className="text-sm font-medium text-ink-700"
                >
                    Parecer
                </label>
                <textarea
                    id={opinionId}
                    rows={3}
                    maxLength={1000}
                    value={opinion}
                    onChange={(event) => setOpinion(event.target.value)}
                    placeholder="Ex.: renda compatível com o valor do aluguel."
                    className="rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20"
                />
            </div>

            {grantsCredit && (
                <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                    <TextField
                        label="Juros (% ao mês)"
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        value={rate}
                        onChange={(event) => setRate(event.target.value)}
                    />
                    <TextField
                        label="Parcelas"
                        type="number"
                        min="1"
                        max="60"
                        step="1"
                        value={installments}
                        onChange={(event) =>
                            setInstallments(event.target.value)
                        }
                    />
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-cream-200">
                        <span className="block text-xs text-ink-500">
                            Parcela estimada
                        </span>
                        <span className="font-semibold">
                            {validCredit
                                ? `${installmentsValue}× ${formatCurrency(
                                      installmentAmount(
                                          order.totalAmount,
                                          rateValue,
                                          installmentsValue,
                                      ),
                                  )}`
                                : '—'}
                        </span>
                    </p>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Voltar
                </Button>
                <Button type="submit" loading={busy} disabled={!canSubmit}>
                    Registrar parecer
                </Button>
            </div>
        </form>
    );
}

export function ContractForm({ order, onDone, onClose }: ActionProps) {
    const name = useId();
    const [ownership, setOwnership] = useState<OwnershipType>('COMPANY');
    const { error, busy, run } = useAction(onDone);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        run(() => executeContract(order.id, ownership));
    }

    return (
        <form
            className="mt-4 space-y-4 rounded-2xl bg-cream-50 p-4"
            onSubmit={handleSubmit}
        >
            <div>
                <h3 className="font-semibold">Executar contrato</h3>
                <p className="mt-1 text-sm text-ink-500">
                    Em nome de quem o carro fica registrado durante o contrato?
                </p>
            </div>
            {error && <Alert>{error}</Alert>}

            <div className="flex flex-col gap-2 sm:flex-row">
                <Choice
                    name={name}
                    value="COMPANY"
                    current={ownership}
                    label="Locadora"
                    description={order.car.owner.name}
                    onSelect={setOwnership}
                />
                <Choice
                    name={name}
                    value="CUSTOMER"
                    current={ownership}
                    label="Cliente"
                    description={order.customer.name}
                    onSelect={setOwnership}
                />
                {order.creditContract && (
                    <Choice
                        name={name}
                        value="BANK"
                        current={ownership}
                        label="Banco"
                        description={`${order.creditContract.bank.name} (credor)`}
                        onSelect={setOwnership}
                    />
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Voltar
                </Button>
                <Button type="submit" variant="dark" loading={busy}>
                    Assinar contrato
                </Button>
            </div>
        </form>
    );
}
