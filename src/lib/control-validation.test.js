import { validateControl } from './control-validation';

function createControl(overrides = {}) {
  return {
    id: 'BA-05',
    name: 'OFAC Screening',
    triggers: ['payment.pre.screen'],
    why_reg_cite: '31 CFR Part 501',
    system_behavior: 'Screen against OFAC SDN list',
    ...overrides,
  };
}

describe('validateControl', () => {
  it('returns valid for a fully populated control', () => {
    const result = validateControl(createControl());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports error when id is missing', () => {
    const result = validateControl(createControl({ id: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Control ID is required');
  });

  it('reports error when name is missing', () => {
    const result = validateControl(createControl({ name: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Control name is required');
  });

  it('reports error when triggers is empty', () => {
    const result = validateControl(createControl({ triggers: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one trigger is required');
  });

  it('reports error when triggers is undefined', () => {
    const control = createControl();
    delete control.triggers;
    const result = validateControl(control);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one trigger is required');
  });

  it('reports error when why_reg_cite is missing', () => {
    const result = validateControl(createControl({ why_reg_cite: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Regulatory citation is required');
  });

  it('reports error when system_behavior is missing', () => {
    const result = validateControl(createControl({ system_behavior: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('System behavior is required');
  });

  it('reports all errors for a completely empty control', () => {
    const result = validateControl({});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });
});
