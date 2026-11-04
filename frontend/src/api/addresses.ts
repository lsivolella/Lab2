import { api } from './client';

/** Address for a ZIP code, looked up by the backend (ViaCEP). */
export interface AddressLookup {
    zipCode: string;
    street: string;
    district: string;
    city: string;
    state: string;
}

/** zipCode: 8 digits. Throws ApiError 404 when the CEP does not exist. */
export function lookupZipCode(zipCode: string): Promise<AddressLookup> {
    return api<AddressLookup>(`/addresses/${zipCode}`);
}
