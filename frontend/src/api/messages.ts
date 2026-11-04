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

    // Evaluation and contract (agents)
    'Orders with credit are evaluated by a bank.':
        'Pedidos com crédito são avaliados por um banco.',
    'Only the company that owns the car evaluates this order.':
        'Só a locadora dona do carro avalia este pedido.',
    'Only the company that owns the car executes the contract.':
        'Só a locadora dona do carro executa o contrato.',
    'Only submitted orders can be evaluated.': 'Este pedido já foi avaliado.',
    'Only approved orders can be contracted.':
        'Só pedidos aprovados podem ter contrato.',
    'Credit terms are required to approve an order with credit.':
        'Informe juros e parcelas para aprovar o crédito.',
    'Credit terms are only accepted when a bank approves an order with credit.':
        'Juros e parcelas só valem quando um banco aprova um pedido com crédito.',
    'BANK ownership requires a credit contract.':
        'O registro em nome do banco exige contrato de crédito.',
    'Opinion is required.': 'Escreva o parecer.',

    // Fleet (company agents)
    'Only company agents can manage cars.':
        'Só locadoras podem cadastrar carros.',
    'Only the owner company can change this car.':
        'Só a locadora dona do carro pode alterá-lo.',
    'Plate already registered.': 'Esta placa já está cadastrada.',
    'Registration already registered.': 'Este RENAVAM já está cadastrado.',
    'Car has orders in progress.':
        'O carro tem pedidos em andamento e não pode ser excluído.',
    'Image file is required.': 'Escolha uma foto.',
    'Image must be a JPEG, PNG or WebP file.':
        'A foto deve ser JPG, PNG ou WebP.',
    'Image must be at most 2 MB.': 'A foto deve ter no máximo 2 MB.',
    'Maximum upload size exceeded': 'A foto deve ter no máximo 2 MB.',
    'Image storage is unavailable. Try again later.':
        'O envio de fotos está indisponível. Tente novamente mais tarde.',
    'Image storage is not configured.':
        'O envio de fotos não está configurado no servidor.',
    'Registration is required.': 'Informe o RENAVAM.',
    'Registration (RENAVAM) must contain exactly 11 digits.':
        'O RENAVAM deve ter 11 dígitos.',
    'Year is required.': 'Informe o ano.',
    'Year must be 1950 or later.': 'O ano deve ser 1950 ou depois.',
    'Year must be 2100 or earlier.': 'O ano deve ser 2100 ou antes.',
    'Brand is required.': 'Informe a marca.',
    'Brand must be at most 50 characters.':
        'A marca deve ter no máximo 50 caracteres.',
    'Model is required.': 'Informe o modelo.',
    'Model must be at most 50 characters.':
        'O modelo deve ter no máximo 50 caracteres.',
    'Plate is required.': 'Informe a placa.',
    'Plate must look like ABC1234 or ABC1D23.':
        'A placa deve seguir o formato ABC1234 ou ABC1D23.',
    'Daily rate is required.': 'Informe o valor da diária.',
    'Daily rate must be greater than zero.':
        'A diária deve ser maior que zero.',
    'Daily rate must have up to 8 digits and 2 decimals.':
        'A diária deve ter até 2 casas decimais.',

    // Address lookup (CEP)
    'ZIP code not found.': 'CEP não encontrado. Preencha o endereço.',
    'Address lookup is unavailable. Fill in the address manually.':
        'Não foi possível buscar o CEP. Preencha o endereço.',

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
