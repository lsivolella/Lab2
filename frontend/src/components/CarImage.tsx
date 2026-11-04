import { CarFront } from 'lucide-react';
import { useState } from 'react';
import type { CarResponse } from '../types/car';

interface CarImageProps {
    car: Pick<CarResponse, 'brand' | 'model' | 'imageUrl'>;
    className?: string;
}

/** Car photo, or a neutral placeholder when there is none or it fails to load. */
export function CarImage({ car, className = '' }: CarImageProps) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const showImage = car.imageUrl && car.imageUrl !== failedUrl;

    if (!showImage) {
        return (
            <div
                className={`grid place-items-center bg-gradient-to-br from-cream-100 to-cream-200 text-cream-300 ${className}`}
                role="img"
                aria-label={`${car.brand} ${car.model} (sem foto)`}
            >
                <CarFront className="size-1/3" aria-hidden="true" />
            </div>
        );
    }

    return (
        <img
            src={car.imageUrl!}
            alt={`${car.brand} ${car.model}`}
            loading="lazy"
            onError={() => setFailedUrl(car.imageUrl)}
            className={`object-cover ${className}`}
        />
    );
}
