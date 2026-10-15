import type { AbstractIntlMessages } from 'next-intl';
import { createTranslator } from 'next-intl';

const FALLBACK_LANGUAGE = 'en';

export async function initializeEmailI18n(params: {
  language: string | undefined;
  namespace: string;
}) {
  // Without an explicit language, follow the app's default locale — otherwise
  // a non-English deployment still sends English emails.
  const language =
    params.language ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    FALLBACK_LANGUAGE;

  const candidates =
    language === FALLBACK_LANGUAGE ? [language] : [language, FALLBACK_LANGUAGE];

  for (const candidate of candidates) {
    const messages = await loadMessages(candidate, params.namespace);

    if (!messages) {
      continue;
    }

    // Create a translator function with the messages
    const translator = createTranslator({
      locale: candidate,
      messages,
    });

    // Type-cast to make it compatible with the i18next API
    const t = translator as unknown as (
      key: string,
      values?: Record<string, unknown>,
    ) => string;

    // Return an object compatible with the i18next API
    return {
      t,
      language: candidate,
    };
  }

  // Return a fallback translator that returns the key as-is
  const t = (key: string) => key;

  return {
    t,
    language,
  };
}

async function loadMessages(language: string, namespace: string) {
  try {
    return (await import(
      `../locales/${language}/${namespace}.json`
    )) as AbstractIntlMessages;
  } catch (error) {
    console.log(
      `Error loading i18n file: locales/${language}/${namespace}.json`,
      error,
    );

    return null;
  }
}
