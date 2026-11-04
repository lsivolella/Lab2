import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { translate } from '../api/messages';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Page the user tried to open before being sent to login (see RequireAuth).
    const from =
        (location.state as { from?: { pathname: string } } | null)?.from
            ?.pathname ?? '/';

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await login({ email, password });
            navigate(from, { replace: true });
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
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <TextField
                    label="Senha"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                <Button
                    type="submit"
                    loading={submitting}
                    disabled={!email || !password}
                    className="w-full"
                >
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
