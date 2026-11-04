import type { CarResponse } from '../types/car';
import type { Page } from '../types/page';
import { api } from './client';

/** The whole fleet in one page: enough for this project's fleet size. */
export function fetchCars(): Promise<Page<CarResponse>> {
    return api<Page<CarResponse>>('/cars?size=100&sort=brand&sort=model');
}
