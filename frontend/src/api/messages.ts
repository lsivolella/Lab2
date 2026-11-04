// The API answers in English; the interface is in Portuguese. These maps
// translate the messages the backend can send. Unknown messages fall back to
// a generic text, so a new backend message never shows up in English.

const MESSAGES: Record<string, string> = {
    // Auth and account
    'Invalid email or password.': 'E-mail ou senha incorretos.',
    'Email already registered.': 'Este e-mail já está cadastrado.',
    'CPF already registered.': 'Este CPF já está cadastrado.',
    'Current password is incorrect.': 'A senha atual está incorreta.',

    // Cars and orders
    'Car not found.': 'Carro não encontrado.',
    'Order not found.': 'Pedido não encontrado.',
    'Car is not available for the selected dates.':
        'O carro não está disponível nessas datas.',
    'End date must be after start date.':
        'A devolução deve ser depois da retirada.',
    'Start date must be today or later.': 'A retirada deve ser hoje ou depois.',
    'Only submitted orders can be changed.':
        'Este pedido já foi avaliado e não pode ser alterado.',
    'Only submitted orders can be cancelled.':
        'Este pedido já foi avaliado e não pode ser cancelado.',

    // Validation (per field)
    'Name is required.': 'Informe o nome.',
    'Name must be at most 150 characters.':
        'O nome deve ter no máximo 150 caracteres.',
    'RG is required.': 'Informe o RG.',
    'RG must be at most 20 characters.':
        'O RG deve ter no máximo 20 caracteres.',
    'CPF is required.': 'Informe o CPF.',
    'CPF must contain exactly 11 digits.': 'O CPF deve ter 11 dígitos.',
    'Invalid CPF.': 'CPF inválido.',
    'Profession is required.': 'Informe a profissão.',
    'Profession must be at most 100 characters.':
        'A profissão deve ter no máximo 100 caracteres.',
    'Email is required.': 'Informe o e-mail.',
    'Invalid email.': 'E-mail inválido.',
    'Email must be at most 254 characters.':
        'O e-mail deve ter no máximo 254 caracteres.',
    'Password is required.': 'Informe a senha.',
    'Password must be between 8 and 72 characters.':
        'A senha deve ter entre 8 e 72 caracteres.',
    'Address is required.': 'Informe o endereço.',
    'Street is required.': 'Informe a rua.',
    'Number is required.': 'Informe o número.',
    'District is required.': 'Informe o bairro.',
    'City is required.': 'Informe a cidade.',
    'State is required.': 'Informe a UF.',
    'State must be a 2-letter uppercase code.':
        'A UF deve ter 2 letras, como MG.',
    'ZIP code is required.': 'Informe o CEP.',
    'ZIP code must contain exactly 8 digits.': 'O CEP deve ter 8 dígitos.',
    'At most 3 incomes are allowed.': 'Informe no máximo 3 rendimentos.',
    'Employer is required.': 'Informe a entidade empregadora.',
    'Income amount is required.': 'Informe o valor do rendimento.',
    'Income amount must be greater than zero.':
        'O rendimento deve ser maior que zero.',
};

const GENERIC = 'Não foi possível concluir a operação. Tente novamente.';

export function translate(message: string | undefined): string {
    return (message && MESSAGES[message]) ?? GENERIC;
}

/** Translates the per-field validation errors of an ApiError. */
export function translateErrors(
    errors: Record<string, string>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(errors).map(([field, message]) => [
            field,
            translate(message),
        ]),
    );
}
