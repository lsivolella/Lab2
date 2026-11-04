import type { CarRequest, CarResponse } from '../types/car';
import type { Page } from '../types/page';
import { api } from './client';

/** The whole fleet in one page: enough for this project's fleet size. */
export function fetchCars(): Promise<Page<CarResponse>> {
    return api<Page<CarResponse>>('/cars?size=100&sort=brand&sort=model');
}

/** Fleet of the logged-in company agent. */
export function fetchMyCars(): Promise<Page<CarResponse>> {
    return api<Page<CarResponse>>('/cars/mine?size=100&sort=brand&sort=model');
}

export function createCar(request: CarRequest): Promise<CarResponse> {
    return api<CarResponse>('/cars', { method: 'POST', body: request });
}

export function updateCar(
    id: number,
    request: CarRequest,
): Promise<CarResponse> {
    return api<CarResponse>(`/cars/${id}`, { method: 'PUT', body: request });
}

export function deleteCar(id: number): Promise<void> {
    return api<void>(`/cars/${id}`, { method: 'DELETE' });
}

/** JPEG, PNG or WebP up to 2 MB; replaces the previous image. */
export function uploadCarImage(id: number, file: File): Promise<CarResponse> {
    const form = new FormData();
    form.append('file', file);

    return api<CarResponse>(`/cars/${id}/image`, { method: 'PUT', body: form });
}
