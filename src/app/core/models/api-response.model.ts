/**
 * Generic paginated API response from the backend.
 *
 * Shape:
 * {
 *   isSuccess: boolean,
 *   data: { items: T[], currentPage, itemsPerPage, totalItems, totalPages, nextPage },
 *   errorMessage: string | null
 * }
 */
export interface ApiResponse<T> {
    isSuccess: boolean;
    data: T;
    errorMessage: string | null;
}

export interface PaginatedData<T> {
    items: T[];
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    nextPage: boolean;
}
