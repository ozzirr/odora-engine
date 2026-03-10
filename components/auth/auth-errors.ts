type LoginErrorKey =
  | "errors.authCallbackFailed"
  | "errors.emailVerificationFailed"
  | "errors.invalidAuthCallback"
  | "errors.authNotConfigured"
  | "errors.fallback";

type SignupErrorKey = "errors.fallback";

export function mapLoginAuthError(
  errorCode: string | undefined,
  t: (key: LoginErrorKey) => string,
) {
  if (!errorCode) {
    return undefined;
  }

  if (errorCode === "auth_callback_failed") {
    return t("errors.authCallbackFailed");
  }

  if (errorCode === "email_verification_failed") {
    return t("errors.emailVerificationFailed");
  }

  if (errorCode === "invalid_auth_callback") {
    return t("errors.invalidAuthCallback");
  }

  if (errorCode === "auth_not_configured") {
    return t("errors.authNotConfigured");
  }

  return t("errors.fallback");
}

export function mapSignupAuthError(
  errorCode: string | undefined,
  t: (key: SignupErrorKey) => string,
) {
  if (!errorCode) {
    return undefined;
  }

  return t("errors.fallback");
}
