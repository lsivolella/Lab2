// The API uses ISO dates ("2026-11-10") with no time or time zone. These
// helpers work on the date parts directly, so no day shifts by a time zone.

function toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function fromIso(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export function todayIso(): string {
    return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
    const date = fromIso(iso);
    date.setDate(date.getDate() + days);

    return toIso(date);
}

/** Whole days from start to end (the number of daily rates). */
export function daysBetween(startIso: string, endIso: string): number {
    const millis = fromIso(endIso).getTime() - fromIso(startIso).getTime();

    return Math.round(millis / 86_400_000);
}

/** "2026-11-10" -> "10/11/2026" */
export function formatDate(iso: string): string {
    const [year, month, day] = iso.slice(0, 10).split('-');

    return `${day}/${month}/${year}`;
}

const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export function formatCurrency(value: number): string {
    return currency.format(value);
}
