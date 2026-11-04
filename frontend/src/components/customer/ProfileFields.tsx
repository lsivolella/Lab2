import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { lookupZipCode } from '../../api/addresses';
import { ApiError } from '../../api/client';
import { translate } from '../../api/messages';
import { formatCpf, formatZipCode, onlyDigits } from '../../utils/format';
import { FormSection } from '../FormSection';
import { Button } from '../ui/Button';
import { MoneyField } from '../ui/MoneyField';
import { SelectField } from '../ui/SelectField';
import { TextField } from '../ui/TextField';
import {
    errorPath,
    MAX_INCOMES,
    type Errors,
    type IncomeRow,
    type ProfileForm,
} from './profileForm';

// prettier-ignore
const STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
] as const;

interface ProfileFieldsProps {
    form: ProfileForm;
    incomes: IncomeRow[];
    errors: Errors;
    /** CPF cannot change after registration. */
    cpfReadOnly?: boolean;
    onFieldChange: (field: keyof ProfileForm, value: string) => void;
    onIncomesChange: (incomes: IncomeRow[]) => void;
    /** Called with the error path of an edited field, to clear its error. */
    onClearError: (path: string) => void;
}

/**
 * Customer data required by the assignment: identification (name, CPF, RG),
 * profession, address and up to 3 employers with their incomes.
 */
export function ProfileFields({
    form,
    incomes,
    errors,
    cpfReadOnly = false,
    onFieldChange,
    onIncomesChange,
    onClearError,
}: ProfileFieldsProps) {
    const numberRef = useRef<HTMLInputElement>(null);
    const lastLookup = useRef('');
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupMessage, setLookupMessage] = useState<string | null>(null);

    function field(
        name: keyof ProfileForm,
        format?: (value: string) => string,
    ) {
        return {
            value: form[name],
            error: errors[errorPath(name)],
            onChange: (event: { target: { value: string } }) => {
                const value = event.target.value;
                onFieldChange(name, format ? format(value) : value);
                onClearError(errorPath(name));
            },
        };
    }

    /**
     * When the CEP is complete, fills street, district, city and state from the
     * lookup and moves the cursor to the number. On failure the user just fills
     * the address in by hand.
     */
    async function changeZipCode(value: string) {
        const formatted = formatZipCode(value);
        const digits = onlyDigits(formatted);

        onFieldChange('zipCode', formatted);
        onClearError(errorPath('zipCode'));
        lastLookup.current = digits;
        setLookupMessage(null);

        if (digits.length !== 8) {
            return;
        }

        setLookingUp(true);

        try {
            const address = await lookupZipCode(digits);

            // Ignore answers for a CEP the user has already changed.
            if (lastLookup.current !== digits) {
                return;
            }

            const found: [keyof ProfileForm, string][] = [
                ['street', address.street],
                ['district', address.district],
                ['city', address.city],
                ['state', address.state],
            ];

            for (const [name, fieldValue] of found) {
                if (fieldValue) {
                    onFieldChange(name, fieldValue);
                    onClearError(errorPath(name));
                }
            }

            numberRef.current?.focus();
        } catch (caught) {
            if (lastLookup.current === digits) {
                setLookupMessage(
                    caught instanceof ApiError
                        ? translate(caught.message)
                        : 'Não foi possível buscar o CEP. Preencha o endereço.',
                );
            }
        } finally {
            if (lastLookup.current === digits) {
                setLookingUp(false);
            }
        }
    }

    function updateIncome(index: number, key: keyof IncomeRow, value: string) {
        onIncomesChange(
            incomes.map((income, i) =>
                i === index ? { ...income, [key]: value } : income,
            ),
        );
        onClearError(`incomes[${index}].${key}`);
    }

    return (
        <>
            <FormSection title="Dados pessoais">
                <TextField
                    className="sm:col-span-6"
                    label="Nome completo"
                    autoComplete="name"
                    {...field('name')}
                />
                <TextField
                    className="sm:col-span-3"
                    label="CPF"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    readOnly={cpfReadOnly}
                    hint={
                        cpfReadOnly ? 'O CPF não pode ser alterado.' : undefined
                    }
                    {...field('cpf', formatCpf)}
                />
                <TextField
                    className="sm:col-span-3"
                    label="RG"
                    {...field('rg')}
                />
                <TextField
                    className="sm:col-span-6"
                    label="Profissão"
                    autoComplete="organization-title"
                    {...field('profession')}
                />
            </FormSection>

            <FormSection title="Endereço">
                <TextField
                    className="sm:col-span-2"
                    label="CEP"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={form.zipCode}
                    error={
                        errors[errorPath('zipCode')] ??
                        lookupMessage ??
                        undefined
                    }
                    hint={
                        lookingUp
                            ? 'Buscando endereço…'
                            : 'Preenche o endereço.'
                    }
                    onChange={(event) => changeZipCode(event.target.value)}
                />
                <TextField
                    className="sm:col-span-4"
                    label="Rua"
                    autoComplete="address-line1"
                    {...field('street')}
                />
                <TextField
                    className="sm:col-span-2"
                    label="Número"
                    ref={numberRef}
                    {...field('number')}
                />
                <TextField
                    className="sm:col-span-4"
                    label="Complemento"
                    hint="Opcional"
                    autoComplete="address-line2"
                    {...field('complement')}
                />
                <TextField
                    className="sm:col-span-2"
                    label="Bairro"
                    {...field('district')}
                />
                <TextField
                    className="sm:col-span-2"
                    label="Cidade"
                    autoComplete="address-level2"
                    {...field('city')}
                />
                <SelectField
                    className="sm:col-span-2"
                    label="UF"
                    placeholder="—"
                    options={STATES}
                    {...field('state')}
                />
            </FormSection>

            <FormSection
                title="Rendimentos"
                description={`Entidades empregadoras e rendimentos mensais (até ${MAX_INCOMES}). Opcional, mas ajuda na análise financeira do pedido.`}
            >
                {incomes.map((income, index) => (
                    <div
                        key={index}
                        className="grid gap-4 sm:col-span-6 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-start"
                    >
                        <TextField
                            label={`Empregador ${index + 1}`}
                            value={income.employer}
                            error={errors[`incomes[${index}].employer`]}
                            onChange={(event) =>
                                updateIncome(
                                    index,
                                    'employer',
                                    event.target.value,
                                )
                            }
                        />
                        <MoneyField
                            label="Rendimento (R$)"
                            value={income.amount}
                            error={errors[`incomes[${index}].amount`]}
                            onValueChange={(value) =>
                                updateIncome(index, 'amount', value)
                            }
                        />
                        <button
                            type="button"
                            aria-label={`Remover rendimento ${index + 1}`}
                            className="grid size-12 place-items-center self-end rounded-2xl text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            onClick={() =>
                                onIncomesChange(
                                    incomes.filter((_, i) => i !== index),
                                )
                            }
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                ))}
                {incomes.length < MAX_INCOMES && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="ring-1 ring-cream-200 sm:col-span-6 sm:justify-self-start"
                        onClick={() =>
                            onIncomesChange([
                                ...incomes,
                                { employer: '', amount: '' },
                            ])
                        }
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Adicionar rendimento
                    </Button>
                )}
            </FormSection>
        </>
    );
}
