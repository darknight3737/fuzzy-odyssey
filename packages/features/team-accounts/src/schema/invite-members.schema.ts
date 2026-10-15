import * as z from 'zod';

const InviteSchema = z.object({
  // Normalize the email at the boundary: Supabase Auth (GoTrue) lowercases
  // emails at sign-up, so an invitation stored as `Owner@example.com` would
  // never match the resulting `owner@example.com` user. Case is insignificant
  // for the local part in practice, so we canonicalize on write.
  email: z.string().trim().toLowerCase().email(),
  role: z.string().min(1).max(100),
});

export const InviteMembersSchema = z
  .object({
    invitations: InviteSchema.array().min(1).max(5),
  })
  .refine(
    (data) => {
      const emails = data.invitations.map((member) =>
        member.email.toLowerCase(),
      );

      const uniqueEmails = new Set(emails);

      return emails.length === uniqueEmails.size;
    },
    {
      message: 'Duplicate emails are not allowed',
      path: ['invitations'],
    },
  );
