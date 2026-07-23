import { describe, it, expect } from 'vitest';
import {
  isValidIndianMobile,
  validateContactDetails,
  type ContactDetailsInput,
} from './checkout-validation';

describe('isValidIndianMobile', () => {
  it('accepts a plain 10-digit mobile number', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
  });

  it('accepts a number with a +91 country code and spaces', () => {
    expect(isValidIndianMobile('+91 98765 43210')).toBe(true);
  });

  it('accepts a number with a leading 0 (common local dialing habit)', () => {
    expect(isValidIndianMobile('09876543210')).toBe(true);
  });

  it('rejects a number that does not start with 6-9 (failure case: landline-style or invalid prefix)', () => {
    expect(isValidIndianMobile('1234567890')).toBe(false);
  });

  it('rejects a number that is too short', () => {
    expect(isValidIndianMobile('98765')).toBe(false);
  });

  it('rejects a foreign-looking number with a non-91 country code', () => {
    expect(isValidIndianMobile('+1 9876543210')).toBe(false);
  });
});

const validContact: ContactDetailsInput = {
  name: 'Priya Sharma',
  phone: '9876543210',
  address: '',
};

describe('validateContactDetails', () => {
  it('returns no errors when name and phone are valid, even with no address (address is optional)', () => {
    expect(validateContactDetails(validContact)).toEqual({});
  });

  it('requires a name', () => {
    const errors = validateContactDetails({ ...validContact, name: '  ' });
    expect(errors.name).toBeTruthy();
  });

  it('requires a valid phone number', () => {
    const errors = validateContactDetails({ ...validContact, phone: '123' });
    expect(errors.phone).toBeTruthy();
  });

  it('never produces an address error, no matter what (or nothing) is entered', () => {
    expect(validateContactDetails({ ...validContact, address: '' })).toEqual({});
    expect(validateContactDetails({ ...validContact, address: 'Mumbai' })).toEqual({});
    expect(
      validateContactDetails({
        ...validContact,
        address: '221B Baker Colony, Andheri West, Mumbai',
      })
    ).toEqual({});
  });
});
