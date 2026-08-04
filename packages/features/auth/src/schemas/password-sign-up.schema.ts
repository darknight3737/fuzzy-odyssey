import * as z from 'zod';

import {
  createRefinedPasswordSchema,
  refineRepeatPassword,
  webPasswordRequirements,
  type PasswordRequirements,
} from './password.schema';

export const createPasswordSignUpSchema = (
  passwordRequirements: PasswordRequirements,
) => {
  const password = createRefinedPasswordSchema(passwordRequirements);

  return z
    .object({
      email: z.email({ message: 'auth.errors.invalidEmail' }),
      password,
      repeatPassword: password,
    })
    .superRefine(refineRepeatPassword);
};

export const PasswordSignUpSchema = createPasswordSignUpSchema(
  webPasswordRequirements,
);
