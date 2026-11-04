// Spring Data PagedModel, as returned by the list endpoints.
export interface Page<T> {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}
