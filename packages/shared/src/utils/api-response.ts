export const successResponse = <T>(data: T, message = 'Success') => ({
  data,
  message,
});

export const paginateResponse = <T>(items: T[], total: number, page: number, pageSize: number) => ({
  data: items,
  meta: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  },
});
