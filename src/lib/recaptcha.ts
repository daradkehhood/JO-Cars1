const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

export interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
}

export async function verifyRecaptcha(
  token: string,
  action: string,
  req?: Request
): Promise<RecaptchaResult> {
  if (!RECAPTCHA_SECRET) {
    return { success: true, score: 1.0, action };
  }

  try {
    const ip = req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req?.headers?.get('x-real-ip')
      || '';

    const formData = new URLSearchParams();
    formData.append('secret', RECAPTCHA_SECRET);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = await res.json();
    return {
      success: data.success && data.score >= 0.5,
      score: data.score || 0,
      action: data.action || action,
    };
  } catch {
    return { success: false, score: 0, action };
  }
}
