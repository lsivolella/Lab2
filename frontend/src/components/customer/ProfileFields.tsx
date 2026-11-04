import { Plus, Trash2 } from 'lucide-react';
import { formatCpf, formatZipCode } from '../../utils/format';
import { FormSection } from '../FormSection';
import { Button } from '../ui/Button';
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
                    {...field('zipCode', formatZipCode)}
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
                        <TextField
                            label="Rendimento (R$)"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={income.amount}
                            error={errors[`incomes[${index}].amount`]}
                            onChange={(event) =>
                                updateIncome(
                                    index,
                                    'amount',
                                    event.target.value,
                                )
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
