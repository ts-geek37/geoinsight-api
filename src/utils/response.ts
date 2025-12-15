interface Response<T> {
  status: number;
  body: {
    success: boolean;
    data: T;
    error: string | null;
  };
}

export function success<T>(data: T, status = 200): Response<T> {
  return {
    status,
    body: {
      success: true,
      data,
      error: null,
    },
  };
}

export function failure(message: string, status = 400): Response<null> {
  return {
    status,
    body: {
      success: false,
      data: null,
      error: message,
    },
  };
}
