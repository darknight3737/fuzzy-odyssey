import * as z from 'zod';

import {
  createRefinedPasswordSchema,
  refineRepeatPassword,
  webPasswordRequirements,
  type PasswordRequirements,
} from './password.schema';

export const createPasswordResetSchema = (
  passwordRequirements: PasswordRequirements,
) => {
  const password = createRefinedPasswordSchema(passwordRequirements);

  return z
    .object({
      password,
      repeatPassword: password,
    })
    .superRefine(refineRepeatPassword);
};

export const PasswordResetSchema = createPasswordResetSchema(
  webPasswordRequirements,
);
