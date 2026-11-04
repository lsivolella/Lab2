import { ImageUp } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { createCar, updateCar, uploadCarImage } from '../api/cars';
import { ApiError } from '../api/client';
import { translate, translateErrors } from '../api/messages';
import type { CarRequest, CarResponse } from '../types/car';
import { onlyDigits } from '../utils/format';
import { CarImage } from './CarImage';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MoneyField } from './ui/MoneyField';
import { TextField } from './ui/TextField';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

interface CarFormModalProps {
    /** Car to edit; omit to register a new one. */
    car?: CarResponse;
    onSaved: (car: CarResponse) => void;
    onClose: () => void;
}

function initialForm(car?: CarResponse) {
    return {
        registration: car?.registration ?? '',
        year: car ? String(car.year) : String(new Date().getFullYear()),
        brand: car?.brand ?? '',
        model: car?.model ?? '',
        plate: car?.plate ?? '',
        dailyRate: car ? String(car.dailyRate) : '',
    };
}

type FormState = ReturnType<typeof initialForm>;

function validate(form: FormState, file: File | null, creating: boolean) {
    const errors: Record<string, string> = {};

    if (form.registration.length !== 11) {
        errors.registration = 'O RENAVAM deve ter 11 dígitos.';
    }

    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
        errors.year = 'Informe um ano entre 1950 e 2100.';
    }

    if (!form.brand.trim()) {
        errors.brand = 'Informe a marca.';
    }

    if (!form.model.trim()) {
        errors.model = 'Informe o modelo.';
    }

    if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(form.plate)) {
        errors.plate = 'Use o formato ABC1234 ou ABC1D23.';
    }

    if (!(Number(form.dailyRate) > 0)) {
        errors.dailyRate = 'A diária deve ser maior que zero.';
    }

    if (creating && !file) {
        errors.image = 'Escolha uma foto do carro.';
    } else if (file && !IMAGE_TYPES.includes(file.type)) {
        errors.image = 'A foto deve ser JPG, PNG ou WebP.';
    } else if (file && file.size > MAX_IMAGE_BYTES) {
        errors.image = 'A foto deve ter no máximo 2 MB.';
    }

    return errors;
}

/**
 * Register or edit a car of the logged-in company. The photo is required for
 * new cars (every car needs one) and optional when editing (replaces it).
 * Saving is two calls: the car data, then the photo upload.
 */
export function CarFormModal({ car, onSaved, onClose }: CarFormModalProps) {
    const fileInputId = useId();
    // After a create whose upload failed, keep editing the created car.
    const [savedCar, setSavedCar] = useState<CarResponse | undefined>(car);
    const [form, setForm] = useState(() => initialForm(car));
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const creating = savedCar === undefined;

    // Local preview of the chosen file; the URL is released when it changes.
    const preview = useMemo(
        () => (file ? URL.createObjectURL(file) : null),
        [file],
    );

    useEffect(
        () => () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        },
        [preview],
    );

    function update(field: keyof FormState, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const clientErrors = validate(form, file, creating);
        setErrors(clientErrors);

        if (Object.keys(clientErrors).length > 0) {
            return;
        }

        const request: CarRequest = {
            registration: form.registration,
            year: Number(form.year),
            brand: form.brand.trim(),
            model: form.model.trim(),
            plate: form.plate,
            dailyRate: Number(form.dailyRate),
        };

        setSaving(true);
        let current = savedCar;

        try {
            current = savedCar
                ? await updateCar(savedCar.id, request)
                : await createCar(request);
            setSavedCar(current);

            if (file) {
                current = await uploadCarImage(current.id, file);
            }

            onSaved(current);
            onClose();
        } catch (caught) {
            if (current) {
                // The car was saved; only the photo upload failed.
                onSaved(current);
            }

            if (caught instanceof ApiError) {
                setErrors(translateErrors(caught.errors));
                setFormError(
                    Object.keys(caught.errors).length > 0
                        ? 'Revise os campos destacados.'
                        : translate(caught.message),
                );
            } else {
                setFormError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal title={car ? 'Editar carro' : 'Novo carro'} onClose={onClose}>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {formError && <Alert>{formError}</Alert>}

                <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
                    <div className="flex flex-col gap-2">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Prévia da foto escolhida"
                                className="aspect-[16/10] w-full rounded-2xl object-cover"
                            />
                        ) : (
                            <CarImage
                                car={{
                                    brand: form.brand || 'Carro',
                                    model: form.model,
                                    imageUrl: savedCar?.imageUrl ?? null,
                                }}
                                className="aspect-[16/10] w-full rounded-2xl"
                            />
                        )}
                        <label
                            htmlFor={fileInputId}
                            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold ring-1 ring-cream-200 hover:bg-cream-100"
                        >
                            <ImageUp className="size-4" aria-hidden="true" />
                            {creating || !savedCar?.imageUrl
                                ? 'Escolher foto'
                                : 'Trocar foto'}
                        </label>
                        <input
                            id={fileInputId}
                            type="file"
                            accept={IMAGE_TYPES.join(',')}
                            className="sr-only"
                            onChange={(event) => {
                                setFile(event.target.files?.[0] ?? null);
                                setErrors((current) => {
                                    const next = { ...current };
                                    delete next.image;
                                    return next;
                                });
                            }}
                        />
                        <p
                            className={`text-xs ${errors.image ? 'text-red-600' : 'text-ink-400'}`}
                        >
                            {errors.image ?? 'JPG, PNG ou WebP, até 2 MB.'}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="Marca"
                            value={form.brand}
                            error={errors.brand}
                            onChange={(event) =>
                                update('brand', event.target.value)
                            }
                        />
                        <TextField
                            label="Modelo"
                            value={form.model}
                            error={errors.model}
                            onChange={(event) =>
                                update('model', event.target.value)
                            }
                        />
                        <TextField
                            label="Ano"
                            type="number"
                            min="1950"
                            max="2100"
                            value={form.year}
                            error={errors.year}
                            onChange={(event) =>
                                update('year', event.target.value)
                            }
                        />
                        <MoneyField
                            label="Diária (R$)"
                            value={form.dailyRate}
                            error={errors.dailyRate}
                            onValueChange={(value) =>
                                update('dailyRate', value)
                            }
                        />
                        <TextField
                            label="Placa"
                            placeholder="ABC1D23"
                            value={form.plate}
                            error={errors.plate}
                            onChange={(event) =>
                                update(
                                    'plate',
                                    event.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, '')
                                        .slice(0, 7),
                                )
                            }
                        />
                        <TextField
                            label="RENAVAM (matrícula)"
                            inputMode="numeric"
                            placeholder="11 dígitos"
                            value={form.registration}
                            error={errors.registration}
                            onChange={(event) =>
                                update(
                                    'registration',
                                    onlyDigits(event.target.value).slice(0, 11),
                                )
                            }
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={saving}>
                        {car ? 'Salvar alterações' : 'Cadastrar carro'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
