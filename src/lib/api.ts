import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Helper: ensures every JSON response ships with a charset so Arabic
// (and other UTF-8 strings) renders correctly across all clients.
function jsonWithCharset(body: unknown, init: ResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return NextResponse.json(body, { ...init, headers });
}

export function successResponse<T>(data: T, status: number = 200) {
  return jsonWithCharset({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return jsonWithCharset({ success: false, error: message }, { status });
}

export function unauthorizedResponse() {
  return jsonWithCharset(
    { success: false, error: 'غير مصرح لك بالوصول' },
    { status: 401 }
  );
}

export function notFoundResponse(resource: string = 'البيانات') {
  return jsonWithCharset(
    { success: false, error: `${resource} غير موجود` },
    { status: 404 }
  );
}

export function validationErrorResponse(error: ZodError) {
  const messages = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return jsonWithCharset(
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
