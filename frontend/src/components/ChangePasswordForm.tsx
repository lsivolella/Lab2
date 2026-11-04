import { CircleCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth';
import { ApiError } from '../api/client';
import { translate, translateErrors } from '../api/messages';
import { FormSection } from './FormSection';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

const EMPTY = { current: '', next: '', confirmation: '' };

export function ChangePasswordForm() {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    function update(field: keyof typeof EMPTY, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
        });
        setSaved(false);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const clientErrors: Record<string, string> = {};
        if (!form.current) {
            clientErrors.current = 'Informe a senha atual.';
        }
        if (form.next.length < 8 || form.next.length > 72) {
            clientErrors.next = 'A senha deve ter entre 8 e 72 caracteres.';
        }
        if (form.next !== form.confirmation) {
            clientErrors.confirmation = 'As senhas não conferem.';
        }
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            return;
        }

        setSaving(true);

        try {
            await changePassword(form.current, form.next);
            setForm(EMPTY);
            setSaved(true);
        } catch (caught) {
            if (caught instanceof ApiError) {
                // Backend field names -> this form's field names.
                const server = translateErrors(caught.errors);
                setErrors({
                    current: server.currentPassword,
                    next: server.newPassword,
                });
                setError(
                    Object.keys(caught.errors).length > 0
                        ? 'Revise os campos destacados.'
                        : translate(caught.message),
                );
            } else {
                setError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <FormSection title="Senha">
                {error && (
                    <div className="sm:col-span-6">
                        <Alert>{error}</Alert>
                    </div>
                )}
                <TextField
                    className="sm:col-span-6"
                    label="Senha atual"
                    type="password"
                    autoComplete="current-password"
                    value={form.current}
                    error={errors.current}
                    onChange={(event) => update('current', event.target.value)}
                />
                <TextField
                    className="sm:col-span-3"
                    label="Nova senha"
                    type="password"
                    autoComplete="new-password"
                    hint="Entre 8 e 72 caracteres."
                    value={form.next}
                    error={errors.next}
                    onChange={(event) => update('next', event.target.value)}
                />
                <TextField
                    className="sm:col-span-3"
                    label="Confirme a nova senha"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmation}
                    error={errors.confirmation}
                    onChange={(event) =>
                        update('confirmation', event.target.value)
                    }
                />
                <div className="flex items-center justify-end gap-3 sm:col-span-6">
                    {saved && (
                        <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                            <CircleCheck
                                className="size-4"
                                aria-hidden="true"
                            />
                            Senha alterada.
                        </span>
                    )}
                    <Button type="submit" variant="dark" loading={saving}>
                        Alterar senha
                    </Button>
                </div>
            </FormSection>
        </form>
    );
}
