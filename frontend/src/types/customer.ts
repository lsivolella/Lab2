// Mirrors the backend DTOs in com.lucas.rentacar.dto.customer and
// dto.auth.RegisterRequest. CPF and ZIP code travel as digits only.

export interface AddressRequest {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    /** Two uppercase letters, e.g. "MG". */
    state: string;
    /** Eight digits, no hyphen. */
    zipCode: string;
}

export interface EmploymentIncomeRequest {
    employer: string;
    amount: number;
}

export interface RegisterRequest {
    name: string;
    rg: string;
    /** Eleven digits, no punctuation. */
    cpf: string;
    profession: string;
    address: AddressRequest;
    /** At most 3. */
    incomes: EmploymentIncomeRequest[];
    email: string;
    password: string;
}
