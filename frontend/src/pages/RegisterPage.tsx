import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { translate, translateErrors } from '../api/messages';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { SelectField } from '../components/ui/SelectField';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import type { RegisterRequest } from '../types/customer';
import {
    formatCpf,
    formatZipCode,
    isValidCpf,
    onlyDigits,
} from '../utils/format';

// prettier-ignore
const STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
] as const;

const MAX_INCOMES = 3;

interface IncomeRow {
    employer: string;
    amount: string;
}

const EMPTY_FORM = {
    name: '',
    cpf: '',
    rg: '',
    profession: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    email: '',
    password: '',
    passwordConfirmation: '',
};

type FormState = typeof EMPTY_FORM;

/** Form fields sent inside "address" (their errors come as "address.<field>"). */
const ADDRESS_FIELDS = new Set<keyof FormState>([
    'zipCode',
    'street',
    'number',
    'complement',
    'district',
    'city',
    'state',
]);

/**
 * Errors are keyed like the backend's field paths (e.g. "address.zipCode",
 * "incomes[0].amount"), so client and server messages land on the same input.
 */
type Errors = Record<string, string>;

function validate(form: FormState, incomes: IncomeRow[]): Errors {
    const errors: Errors = {};
    const required: [keyof FormState, string, string][] = [
        ['name', 'name', 'Informe o nome.'],
        ['rg', 'rg', 'Informe o RG.'],
        ['profession', 'profession', 'Informe a profissão.'],
        ['street', 'address.street', 'Informe a rua.'],
        ['number', 'address.number', 'Informe o número.'],
        ['district', 'address.district', 'Informe o bairro.'],
        ['city', 'address.city', 'Informe a cidade.'],
        ['state', 'address.state', 'Selecione a UF.'],
        ['email', 'email', 'Informe o e-mail.'],
    ];

    for (const [field, path, message] of required) {
        if (!form[field].trim()) {
            errors[path] = message;
        }
    }

    if (!isValidCpf(form.cpf)) {
        errors.cpf = 'CPF inválido.';
    }

    if (onlyDigits(form.zipCode).length !== 8) {
        errors['address.zipCode'] = 'O CEP deve ter 8 dígitos.';
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = 'E-mail inválido.';
    }

    if (form.password.length < 8 || form.password.length > 72) {
        errors.password = 'A senha deve ter entre 8 e 72 caracteres.';
    }

    if (form.password !== form.passwordConfirmation) {
        errors.passwordConfirmation = 'As senhas não conferem.';
    }

    incomes.forEach((income, index) => {
        if (!income.employer.trim()) {
            errors[`incomes[${index}].employer`] =
                'Informe a entidade empregadora.';
        }

        if (!(Number(income.amount) > 0)) {
            errors[`incomes[${index}].amount`] =
                'O rendimento deve ser maior que zero.';
        }
    });

    return errors;
}

function toRequest(form: FormState, incomes: IncomeRow[]): RegisterRequest {
    return {
        name: form.name.trim(),
        rg: form.rg.trim(),
        cpf: onlyDigits(form.cpf),
        profession: form.profession.trim(),
        address: {
            street: form.street.trim(),
            number: form.number.trim(),
            complement: form.complement.trim() || undefined,
            district: form.district.trim(),
            city: form.city.trim(),
            state: form.state,
            zipCode: onlyDigits(form.zipCode),
        },
        incomes: incomes.map((income) => ({
            employer: income.employer.trim(),
            amount: Number(income.amount),
        })),
        email: form.email.trim(),
        password: form.password,
    };
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cream-200 sm:p-8">
            <legend className="sr-only">{title}</legend>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-ink-500">{description}</p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-6">{children}</div>
        </fieldset>
    );
}

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [incomes, setIncomes] = useState<IncomeRow[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    /** Removes a field's error as soon as the user edits it. */
    function clearError(path: string) {
        setErrors((current) => {
            if (!(path in current)) {
                return current;
            }

            const next = { ...current };
            delete next[path];
            return next;
        });
    }

    function showFormError(message: string) {
        setFormError(message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function update<K extends keyof FormState>(field: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [field]: value }));
        clearError(ADDRESS_FIELDS.has(field) ? `address.${field}` : field);
    }

    function updateIncome(
        index: number,
        field: keyof IncomeRow,
        value: string,
    ) {
        setIncomes((current) =>
            current.map((income, i) =>
                i === index ? { ...income, [field]: value } : income,
            ),
        );
        clearError(`incomes[${index}].${field}`);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const clientErrors = validate(form, incomes);
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            showFormError('Revise os campos destacados.');
            return;
        }

        setSubmitting(true);

        try {
            await register(toRequest(form, incomes));
            navigate('/', { replace: true });
        } catch (caught) {
            if (caught instanceof ApiError) {
                setErrors(translateErrors(caught.errors));
                showFormError(
                    Object.keys(caught.errors).length > 0
                        ? 'Revise os campos destacados.'
                        : translate(caught.message),
                );
            } else {
                showFormError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            wide
            title="Criar conta"
            subtitle="Cadastre-se como cliente para fazer pedidos de aluguel."
        >
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {formError && <Alert>{formError}</Alert>}

                <Section title="Dados pessoais">
                    <TextField
                        className="sm:col-span-6"
                        label="Nome completo"
                        autoComplete="name"
                        value={form.name}
                        error={errors.name}
                        onChange={(event) => update('name', event.target.value)}
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="CPF"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        value={form.cpf}
                        error={errors.cpf}
                        onChange={(event) =>
                            update('cpf', formatCpf(event.target.value))
                        }
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="RG"
                        value={form.rg}
                        error={errors.rg}
                        onChange={(event) => update('rg', event.target.value)}
                    />
                    <TextField
                        className="sm:col-span-6"
                        label="Profissão"
                        autoComplete="organization-title"
                        value={form.profession}
                        error={errors.profession}
                        onChange={(event) =>
                            update('profession', event.target.value)
                        }
                    />
                </Section>

                <Section title="Endereço">
                    <TextField
                        className="sm:col-span-2"
                        label="CEP"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        value={form.zipCode}
                        error={errors['address.zipCode']}
                        onChange={(event) =>
                            update('zipCode', formatZipCode(event.target.value))
                        }
                    />
                    <TextField
                        className="sm:col-span-4"
                        label="Rua"
                        autoComplete="address-line1"
                        value={form.street}
                        error={errors['address.street']}
                        onChange={(event) =>
                            update('street', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-2"
                        label="Número"
                        value={form.number}
                        error={errors['address.number']}
                        onChange={(event) =>
                            update('number', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-4"
                        label="Complemento"
                        hint="Opcional"
                        autoComplete="address-line2"
                        value={form.complement}
                        error={errors['address.complement']}
                        onChange={(event) =>
                            update('complement', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-2"
                        label="Bairro"
                        value={form.district}
                        error={errors['address.district']}
                        onChange={(event) =>
                            update('district', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-2"
                        label="Cidade"
                        autoComplete="address-level2"
                        value={form.city}
                        error={errors['address.city']}
                        onChange={(event) => update('city', event.target.value)}
                    />
                    <SelectField
                        className="sm:col-span-2"
                        label="UF"
                        placeholder="—"
                        options={STATES}
                        value={form.state}
                        error={errors['address.state']}
                        onChange={(event) =>
                            update('state', event.target.value)
                        }
                    />
                </Section>

                <Section
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
                                    setIncomes((current) =>
                                        current.filter((_, i) => i !== index),
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
                                setIncomes((current) => [
                                    ...current,
                                    { employer: '', amount: '' },
                                ])
                            }
                        >
                            <Plus className="size-4" aria-hidden="true" />
                            Adicionar rendimento
                        </Button>
                    )}
                </Section>

                <Section title="Acesso">
                    <TextField
                        className="sm:col-span-6"
                        label="E-mail"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        error={errors.email}
                        onChange={(event) =>
                            update('email', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="Senha"
                        type="password"
                        autoComplete="new-password"
                        hint="Entre 8 e 72 caracteres."
                        value={form.password}
                        error={errors.password}
                        onChange={(event) =>
                            update('password', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="Confirme a senha"
                        type="password"
                        autoComplete="new-password"
                        value={form.passwordConfirmation}
                        error={errors.passwordConfirmation}
                        onChange={(event) =>
                            update('passwordConfirmation', event.target.value)
                        }
                    />
                </Section>

                <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="text-sm text-ink-500">
                        Já tem conta?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-brand-600 hover:underline"
                        >
                            Entrar
                        </Link>
                    </p>
                    <Button
                        type="submit"
                        loading={submitting}
                        className="w-full sm:w-auto"
                    >
                        Criar conta
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
