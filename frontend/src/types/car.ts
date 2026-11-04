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
