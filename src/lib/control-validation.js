/**
 * Validate a control object and return errors.
 *
 * @param {object} control
 * @returns {{ errors: string[], valid: boolean }}
 */
export function validateControl(control) {
  const errors = [];
  if (!control.id) errors.push('Control ID is required');
  if (!control.name) errors.push('Control name is required');
  if (!control.triggers?.length) errors.push('At least one trigger is required');
  if (!control.why_reg_cite) errors.push('Regulatory citation is required');
  if (!control.system_behavior) errors.push('System behavior is required');
  return { errors, valid: errors.length === 0 };
}
