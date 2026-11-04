// Input masks and checks for Brazilian documents. The UI shows the masked
// value; the API always receives digits only.

export function onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
}

/** 12345678901 -> 123.456.789-01 (partial input is masked as typed). */
export function formatCpf(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);

    return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/** 30110000 -> 30110-000 */
export function formatZipCode(value: string): string {
    const digits = onlyDigits(value).slice(0, 8);

    return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

/** Same check as the backend's @CPF: 11 digits with valid check digits. */
export function isValidCpf(value: string): boolean {
    const digits = onlyDigits(value);

    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
        return false;
    }

    const numbers = digits.split('').map(Number);

    for (const position of [9, 10]) {
        let sum = 0;

        for (let i = 0; i < position; i++) {
            sum += numbers[i] * (position + 1 - i);
        }

        const remainder = (sum * 10) % 11;

        if ((remainder === 10 ? 0 : remainder) !== numbers[position]) {
            return false;
        }
    }

    return true;
}
