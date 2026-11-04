import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { translate, translateErrors } from '../api/messages';
import { AuthLayout } from '../components/AuthLayout';
import { ProfileFields } from '../components/customer/ProfileFields';
import {
    EMPTY_PROFILE,
    toProfileRequest,
    validateProfile,
    type Errors,
    type IncomeRow,
    type ProfileForm,
} from '../components/customer/profileForm';
import { FormSection } from '../components/FormSection';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { onlyDigits } from '../utils/format';

const EMPTY_ACCOUNT = { email: '', password: '', passwordConfirmation: '' };

type AccountForm = typeof EMPTY_ACCOUNT;

function validateAccount(account: AccountForm): Errors {
    const errors: Errors = {};

    if (!account.email.trim()) {
        errors.email = 'Informe o e-mail.';
    } else if (!/^\S+@\S+\.\S+$/.test(account.email)) {
        errors.email = 'E-mail inválido.';
    }

    if (account.password.length < 8 || account.password.length > 72) {
        errors.password = 'A senha deve ter entre 8 e 72 caracteres.';
    }

    if (account.password !== account.passwordConfirmation) {
        errors.passwordConfirmation = 'As senhas não conferem.';
    }

    return errors;
}

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
    const [incomes, setIncomes] = useState<IncomeRow[]>([]);
    const [account, setAccount] = useState<AccountForm>(EMPTY_ACCOUNT);
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

    function updateAccount(field: keyof AccountForm, value: string) {
        setAccount((current) => ({ ...current, [field]: value }));
        clearError(field);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const clientErrors = {
            ...validateProfile(profile, incomes, { checkCpf: true }),
            ...validateAccount(account),
        };
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            showFormError('Revise os campos destacados.');
            return;
        }

        setSubmitting(true);

        try {
            await register({
                ...toProfileRequest(profile, incomes),
                cpf: onlyDigits(profile.cpf),
                email: account.email.trim(),
                password: account.password,
            });
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

                <ProfileFields
                    form={profile}
                    incomes={incomes}
                    errors={errors}
                    onFieldChange={(field, value) =>
                        setProfile((current) => ({
                            ...current,
                            [field]: value,
                        }))
                    }
                    onIncomesChange={setIncomes}
                    onClearError={clearError}
                />

                <FormSection title="Acesso">
                    <TextField
                        className="sm:col-span-6"
                        label="E-mail"
                        type="email"
                        autoComplete="email"
                        value={account.email}
                        error={errors.email}
                        onChange={(event) =>
                            updateAccount('email', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="Senha"
                        type="password"
                        autoComplete="new-password"
                        hint="Entre 8 e 72 caracteres."
                        value={account.password}
                        error={errors.password}
                        onChange={(event) =>
                            updateAccount('password', event.target.value)
                        }
                    />
                    <TextField
                        className="sm:col-span-3"
                        label="Confirme a senha"
                        type="password"
                        autoComplete="new-password"
                        value={account.passwordConfirmation}
                        error={errors.passwordConfirmation}
                        onChange={(event) =>
                            updateAccount(
                                'passwordConfirmation',
                                event.target.value,
                            )
                        }
                    />
                </FormSection>

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
