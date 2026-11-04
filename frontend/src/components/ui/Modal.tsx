import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

/**
 * Dialog built on the native <dialog>: focus trapping, Esc to close and the
 * backdrop come from the browser. Render it only while it should be open.
 */
export function Modal({ title, onClose, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();

        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-label={title}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-3xl bg-cream-50 p-0 text-ink-900 shadow-2xl backdrop:bg-ink-900/60 backdrop:backdrop-blur-sm"
        >
            <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="grid size-10 place-items-center rounded-full text-ink-500 hover:bg-cream-100 hover:text-ink-900"
                >
                    <X className="size-5" aria-hidden="true" />
                </button>
            </div>
            <div className="max-h-[75svh] overflow-y-auto p-6">{children}</div>
        </dialog>
    );
}
