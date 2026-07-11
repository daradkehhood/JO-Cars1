import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'غير مصرح لك بالوصول' },
    { status: 401 }
  );
}

export function notFoundResponse(resource: string = 'البيانات') {
  return NextResponse.json(
    { success: false, error: `${resource} غير موجود` },
    { status: 404 }
  );
}

export function validationErrorResponse(error: ZodError) {
  const messages = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return NextResponse.json(
    { success: false, error: 'خطأ في التحقق من البيانات', details: messages },
    { status: 422 }
  );
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.endsWith('[]')) {
      const realKey = key.slice(0, -2);
      if (!params[realKey]) params[realKey] = [];
      (params[realKey] as string[]).push(value);
    } else {
      params[key] = value;
    }
  }
  return params;
}
