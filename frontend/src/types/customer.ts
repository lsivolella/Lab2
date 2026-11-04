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

/** Customer profile (CustomerResponse in the backend). */
export interface CustomerResponse {
    id: number;
    name: string;
    email: string;
    rg: string;
    cpf: string;
    profession: string;
    address: Omit<AddressRequest, 'complement'> & { complement: string | null };
    incomes: EmploymentIncomeRequest[];
}

/** Profile data a customer can change; CPF and email are fixed. */
export interface CustomerUpdateRequest {
    name: string;
    rg: string;
    profession: string;
    address: AddressRequest;
    incomes: EmploymentIncomeRequest[];
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
