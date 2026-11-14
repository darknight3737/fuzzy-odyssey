import * as z from 'zod';

export const proofCommand = z.discriminatedUnion('method', [
  z.object({ method: z.literal('account_email') }),
  z.object({ method: z.literal('badge'), page: z.url().max(2048) }),
  z.object({ method: z.literal('dns') }),
  z.object({ method: z.literal('send_email'), email: z.email().max(254) }),
  z.object({ method: z.literal('email'), code: z.string().regex(/^\d{6}$/) }),
  z.object({
    method: z.literal('support'),
    message: z.string().trim().min(20).max(3000),
  }),
]);

export type ProofCommand = z.infer<typeof proofCommand>;

export function verificationDomain(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.port ||
      url.username ||
      url.password ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z][a-z0-9-]+$/.test(host) ||
      /\.(?:localhost|local|internal|invalid|onion|arpa)$/.test(host)
    )
      return null;
    return host;
  } catch {
    return null;
  }
}

export function corporateEmail(email: string | undefined, domain: string) {
  return (
    email?.toLowerCase().split('@')[1] === domain &&
    ![
      'gmail.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com',
      'icloud.com',
      'live.com',
      'proton.me',
      'protonmail.com',
      'uol.com.br',
      'bol.com.br',
    ].includes(domain)
  );
}

export function badgeLink(token: string) {
  return `https://selletive.com/api/badge/${token}`;
}
