import type { ComponentProps } from 'react';
import { onlyDigits } from '../../utils/format';
import { TextField } from './TextField';

type MoneyFieldProps = Omit<
    ComponentProps<typeof TextField>,
    'value' | 'onChange' | 'type'
> & {
    /** Decimal string with a dot, as sent to the API ("4500.50"), or "". */
    value: string;
    onValueChange: (value: string) => void;
};

const display = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Money input in Brazilian format with thousands separators ("4.500,50").
 * Digits fill from the right, like a card machine: typing 4, 5, 0 gives 4,50.
 */
export function MoneyField({
    value,
    onValueChange,
    ...props
}: MoneyFieldProps) {
    const shown = value === '' ? '' : display.format(Number(value));

    return (
        <TextField
            {...props}
            inputMode="numeric"
            placeholder={props.placeholder ?? '0,00'}
            value={shown}
            onChange={(event) => {
                // At most 10 integer digits + 2 decimals, like the backend.
                const digits = onlyDigits(event.target.value).slice(0, 12);

                onValueChange(
                    digits === '' ? '' : (Number(digits) / 100).toFixed(2),
                );
            }}
        />
    );
}
