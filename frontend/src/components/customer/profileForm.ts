// Customer profile form shared by registration and the profile page: state,
// validation and conversion to the API format. Errors are keyed like the
// backend's field paths ("address.zipCode", "incomes[0].amount"), so client
// and server messages land on the same input.
import type {
    AddressRequest,
    CustomerResponse,
    EmploymentIncomeRequest,
} from '../../types/customer';
import {
    formatCpf,
    formatZipCode,
    isValidCpf,
    onlyDigits,
} from '../../utils/format';

export const MAX_INCOMES = 3;

export const EMPTY_PROFILE = {
    name: '',
    cpf: '',
    rg: '',
    profession: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
};

export type ProfileForm = typeof EMPTY_PROFILE;

export interface IncomeRow {
    employer: string;
    amount: string;
}

export type Errors = Record<string, string>;

const ADDRESS_FIELDS = new Set<keyof ProfileForm>([
    'zipCode',
    'street',
    'number',
    'complement',
    'district',
    'city',
    'state',
]);

/** Backend field path of a form field (address fields are nested). */
export function errorPath(field: keyof ProfileForm): string {
    return ADDRESS_FIELDS.has(field) ? `address.${field}` : field;
}

export function validateProfile(
    form: ProfileForm,
    incomes: IncomeRow[],
    { checkCpf }: { checkCpf: boolean },
): Errors {
    const errors: Errors = {};
    const required: [keyof ProfileForm, string][] = [
        ['name', 'Informe o nome.'],
        ['rg', 'Informe o RG.'],
        ['profession', 'Informe a profissão.'],
        ['street', 'Informe a rua.'],
        ['number', 'Informe o número.'],
        ['district', 'Informe o bairro.'],
        ['city', 'Informe a cidade.'],
        ['state', 'Selecione a UF.'],
    ];

    for (const [field, message] of required) {
        if (!form[field].trim()) {
            errors[errorPath(field)] = message;
        }
    }

    if (checkCpf && !isValidCpf(form.cpf)) {
        errors.cpf = 'CPF inválido.';
    }

    if (onlyDigits(form.zipCode).length !== 8) {
        errors['address.zipCode'] = 'O CEP deve ter 8 dígitos.';
    }

    incomes.forEach((income, index) => {
        if (!income.employer.trim()) {
            errors[`incomes[${index}].employer`] =
                'Informe a entidade empregadora.';
        }

        if (!(Number(income.amount) > 0)) {
            errors[`incomes[${index}].amount`] =
                'O rendimento deve ser maior que zero.';
        }
    });

    return errors;
}

/** Profile part of the API request (everything but CPF, email and password). */
export function toProfileRequest(
    form: ProfileForm,
    incomes: IncomeRow[],
): {
    name: string;
    rg: string;
    profession: string;
    address: AddressRequest;
    incomes: EmploymentIncomeRequest[];
} {
    return {
        name: form.name.trim(),
        rg: form.rg.trim(),
        profession: form.profession.trim(),
        address: {
            street: form.street.trim(),
            number: form.number.trim(),
            complement: form.complement.trim() || undefined,
            district: form.district.trim(),
            city: form.city.trim(),
            state: form.state,
            zipCode: onlyDigits(form.zipCode),
        },
        incomes: incomes.map((income) => ({
            employer: income.employer.trim(),
            amount: Number(income.amount),
        })),
    };
}

/** Form state from the customer returned by the API. */
export function fromCustomer(customer: CustomerResponse): {
    form: ProfileForm;
    incomes: IncomeRow[];
} {
    const { address } = customer;

    return {
        form: {
            name: customer.name,
            cpf: formatCpf(customer.cpf),
            rg: customer.rg,
            profession: customer.profession,
            zipCode: formatZipCode(address.zipCode),
            street: address.street,
            number: address.number,
            complement: address.complement ?? '',
            district: address.district,
            city: address.city,
            state: address.state,
        },
        incomes: customer.incomes.map((income) => ({
            employer: income.employer,
            amount: String(income.amount),
        })),
    };
}
