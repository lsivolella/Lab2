import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { TextField } from './TextField';

type PasswordFieldProps = Omit<
    ComponentProps<typeof TextField>,
    'type' | 'trailing'
>;

/** Password input with a button to show or hide what was typed. */
export function PasswordField(props: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <TextField
            {...props}
            type={visible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={visible}
                    className="grid size-10 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-cream-100 hover:text-ink-900"
                >
                    {visible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                        <Eye className="size-4" aria-hidden="true" />
                    )}
                </button>
            }
        />
    );
}
