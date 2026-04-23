const DEFAULT_FALLBACK = 'Live AI insights are unavailable right now.';

export const getFriendlyAiError = (error, fallback = DEFAULT_FALLBACK) => {
  const raw = String(
    error?.response?.data?.error
    || error?.response?.data?.message
    || error?.message
    || error
    || ''
  ).trim();

  if (!raw) {
    return fallback;
  }

  if (/[{}[\]"]/.test(raw) || /code\s*[:=]\s*\d+/i.test(raw)) {
    return fallback;
  }

  if (/quota|rate limit|429/i.test(raw)) {
    return 'Gemini quota limit reached. Try again later.';
  }

  if (/api key|unauthori|forbidden|403|401/i.test(raw)) {
    return 'AI analysis is not configured yet. Check the Gemini API key.';
  }

  if (/temporarily unavailable|service unavailable|503|502|504|500/i.test(raw)) {
    return 'The AI service is temporarily unavailable. Please try again later.';
  }

  return raw.length > 220 ? fallback : raw;
};
