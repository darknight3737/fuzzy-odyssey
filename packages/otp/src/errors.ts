/**
 * Message of the error thrown by verifyOtpForPurpose when the code is wrong,
 * stale, or out of attempts. Kept in a client-safe module so components can
 * match it against an action's serverError.
 */
export const INVALID_OTP_ERROR = 'Invalid OTP';

export function isInvalidOtpError(serverError: unknown) {
  return serverError === INVALID_OTP_ERROR;
}
