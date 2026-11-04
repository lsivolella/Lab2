import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import {
    deleteMyAccount,
    fetchMyProfile,
    updateMyProfile,
} from '../api/customers';
import { translate, translateErrors } from '../api/messages';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { ProfileFields } from '../components/customer/ProfileFields';
import {
    fromCustomer,
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
import type { AgentType } from '../types/user';

const AGENT_TYPE_LABEL: Record<AgentType, string> = {
    COMPANY: 'Locadora',
    BANK: 'Banco',
};

/** Customer data (read, update) — the R and U of the customer CRUD. */
function CustomerProfileForm() {
    const [profile, setProfile] = useState<ProfileForm | null>(null);
    const [incomes, setIncomes] = useState<IncomeRow[]>([]);
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMyProfile()
            .then((customer) => {
                const { form, incomes } = fromCustomer(customer);
                setProfile(form);
                setIncomes(incomes);
                setEmail(customer.email);
            })
            .catch(() => setLoadError('Não foi possível carregar o perfil.'));
    }, []);

    function clearError(path: string) {
        setSaved(false);
        setErrors((current) => {
            if (!(path in current)) {
                return current;
            }

            const next = { ...current };
            delete next[path];
            return next;
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!profile) {
            return;
        }

        setFormError(null);
        setSaved(false);

        const clientErrors = validateProfile(profile, incomes, {
            checkCpf: false,
        });
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            setFormError('Revise os campos destacados.');
            return;
        }

        setSaving(true);

        try {
            const customer = await updateMyProfile(
                toProfileRequest(profile, incomes),
            );
            const reloaded = fromCustomer(customer);
            setProfile(reloaded.form);
            setIncomes(reloaded.incomes);
            setSaved(true);
        } catch (caught) {
            if (caught instanceof ApiError) {
                setErrors(translateErrors(caught.errors));
                setFormError(
                    Object.keys(caught.errors).length > 0
                        ? 'Revise os campos destacados.'
                        : translate(caught.message),
                );
            } else {
                setFormError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setSaving(false);
        }
    }

    if (loadError) {
        return <Alert>{loadError}</Alert>;
    }

    if (!profile) {
        return <div className="h-96 animate-pulse rounded-3xl bg-white/60" />;
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {formError && <Alert>{formError}</Alert>}

            <ProfileFields
                form={profile}
                incomes={incomes}
                errors={errors}
                cpfReadOnly
                onFieldChange={(field, value) =>
                    setProfile((current) =>
                        current ? { ...current, [field]: value } : current,
                    )
                }
                onIncomesChange={(next) => {
                    setIncomes(next);
                    setSaved(false);
                }}
                onClearError={clearError}
            />

            <FormSection title="Acesso">
                <TextField
                    className="sm:col-span-6"
                    label="E-mail"
                    value={email}
                    readOnly
                    hint="O e-mail de acesso não pode ser alterado."
                />
            </FormSection>

            <div className="flex items-center justify-end gap-3">
                {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                        <CircleCheck className="size-4" aria-hidden="true" />
                        Dados salvos.
                    </span>
                )}
                <Button type="submit" loading={saving}>
                    Salvar alterações
                </Button>
            </div>
        </form>
    );
}

/** The D of the customer CRUD: soft delete, then the session ends. */
function DeleteAccount() {
    const { logout } = useAuth();
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setError(null);
        setDeleting(true);

        try {
            await deleteMyAccount();
            // The backend already ended the session; this clears the app state
            // and sends the user to the login page.
            await logout();
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? translate(caught.message)
                    : 'Não foi possível conectar ao servidor.',
            );
            setDeleting(false);
        }
    }

    return (
        <section className="rounded-3xl bg-white p-6 ring-1 ring-red-200 sm:p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-700">
                <TriangleAlert className="size-5" aria-hidden="true" />
                Excluir conta
            </h3>
            <p className="mt-1 text-sm text-ink-500">
                Sua conta é desativada e você não consegue mais entrar. O
                histórico de pedidos é mantido.
            </p>
            {error && (
                <div className="mt-4">
                    <Alert>{error}</Alert>
                </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                {confirming ? (
                    <>
                        <span className="text-sm text-ink-700">
                            Tem certeza? Esta ação não pode ser desfeita.
                        </span>
                        <Button
                            variant="ghost"
                            onClick={() => setConfirming(false)}
                        >
                            Não
                        </Button>
                        <Button
                            variant="danger"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Sim, excluir minha conta
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="ghost"
                        className="text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                        onClick={() => setConfirming(true)}
                    >
                        Excluir conta
                    </Button>
                )}
            </div>
        </section>
    );
}

/**
 * Account page. Customers see and edit their profile, change the password and
 * can delete the account; agents see their organization and change the
 * password.
 */
export function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <section className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">
                {user.role === 'CUSTOMER' ? 'Meu perfil' : 'Minha conta'}
                <span className="text-brand-400">.</span>
            </h1>

            {user.role === 'CUSTOMER' ? (
                <CustomerProfileForm />
            ) : (
                <FormSection title="Organização">
                    <TextField
                        className="sm:col-span-4"
                        label="Nome"
                        value={user.name}
                        readOnly
                    />
                    <TextField
                        className="sm:col-span-2"
                        label="Tipo"
                        value={
                            user.agent ? AGENT_TYPE_LABEL[user.agent.type] : ''
                        }
                        readOnly
                    />
                    <TextField
                        className="sm:col-span-6"
                        label="E-mail"
                        value={user.email}
                        readOnly
                    />
                </FormSection>
            )}

            <ChangePasswordForm />

            {user.role === 'CUSTOMER' && <DeleteAccount />}
        </section>
    );
}
