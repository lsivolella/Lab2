// Mirrors com.lucas.rentacar.dto.car.CarResponse.

export interface CarResponse {
    id: number;
    /** RENAVAM ("matrícula"), 11 digits. */
    registration: string;
    year: number;
    brand: string;
    model: string;
    plate: string;
    dailyRate: number;
    /** Frontend path (/cars/...) or storage URL; null until an image is uploaded. */
    imageUrl: string | null;
    owner: { id: number; name: string };
}

/** Create or change a car (CarRequest in the backend). */
export interface CarRequest {
    registration: string;
    year: number;
    brand: string;
    model: string;
    /** ABC1234 or ABC1D23, uppercase, no hyphen. */
    plate: string;
    dailyRate: number;
}
