import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { translate, translateErrors } from '../api/messages';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';

type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
    const errors: Errors = {};

    if (!email.trim()) {
        errors.email = 'Informe o e-mail.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        errors.email = 'E-mail inválido.';
    }

    if (!password) {
        errors.password = 'Informe a senha.';
    }

    return errors;
}

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Page the user tried to open before being sent to login (see RequireAuth).
    const from =
        (location.state as { from?: { pathname: string } } | null)?.from
            ?.pathname ?? '/';

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const clientErrors = validate(email, password);
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            return;
        }

        setSubmitting(true);

        try {
            await login({ email: email.trim(), password });
            navigate(from, { replace: true });
        } catch (caught) {
            if (caught instanceof ApiError) {
                const fieldErrors = translateErrors(caught.errors);
                setErrors(fieldErrors);
                setError(
                    Object.keys(fieldErrors).length > 0
                        ? null
                        : translate(caught.message),
                );
            } else {
                setError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            title="Entrar"
            subtitle="Acesse com o e-mail e a senha cadastrados."
        >
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {error && <Alert>{error}</Alert>}

                <TextField
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    value={email}
                    error={errors.email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        setErrors((current) => ({
                            ...current,
                            email: undefined,
                        }));
                    }}
                />
                <PasswordField
                    label="Senha"
                    autoComplete="current-password"
                    value={password}
                    error={errors.password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((current) => ({
                            ...current,
                            password: undefined,
                        }));
                    }}
                />

                <Button type="submit" loading={submitting} className="w-full">
                    Entrar
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-500">
                Ainda não tem conta?{' '}
                <Link
                    to="/cadastro"
                    className="font-semibold text-brand-600 hover:underline"
                >
                    Cadastre-se
                </Link>
            </p>
        </AuthLayout>
    );
}
