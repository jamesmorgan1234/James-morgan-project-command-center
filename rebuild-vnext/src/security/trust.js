export const SENSITIVITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  SENSITIVE: 'sensitive',
  SECRET: 'secret',
  FINANCIAL: 'financial',
  CREDIT: 'credit',
  IDENTITY: 'identity',
  BUSINESS_CONFIDENTIAL: 'business_confidential',
  PROTECTED_ASSET: 'protected_asset'
});

export const TRUST = Object.freeze({
  OWNER: 'owner',
  VERIFIED_SYSTEM: 'verified_system',
  MODEL_OUTPUT: 'model_output',
  EXTERNAL_PROVIDER: 'external_provider',
  EXTERNAL_CONTENT: 'external_content'
});

export function canAuthorize(sourceTrust) {
  return sourceTrust === TRUST.OWNER;
}

export function deriveSensitivity(inputs) {
  const rank = [SENSITIVITY.PUBLIC, SENSITIVITY.PRIVATE, SENSITIVITY.BUSINESS_CONFIDENTIAL, SENSITIVITY.SENSITIVE, SENSITIVITY.IDENTITY, SENSITIVITY.FINANCIAL, SENSITIVITY.CREDIT, SENSITIVITY.PROTECTED_ASSET, SENSITIVITY.SECRET];
  return inputs.reduce((current, item) => rank.indexOf(item) > rank.indexOf(current) ? item : current, SENSITIVITY.PUBLIC);
}
