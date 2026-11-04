/**
 * Fixed installment (Price table), same formula as the backend:
 * amount * i / (1 - (1 + i)^-n), with i the monthly rate as a fraction.
 * With 0% interest it is amount / n.
 */
export function installmentAmount(
    amount: number,
    monthlyRatePercent: number,
    installments: number,
): number {
    const rate = monthlyRatePercent / 100;

    if (rate === 0) {
        return amount / installments;
    }

    return (amount * rate) / (1 - Math.pow(1 + rate, -installments));
}
