import { describe, it, expect } from 'vitest';
import { validateCheckoutForm, isValidIndianMobile, type CheckoutFormInput } from './checkout-validation';

const validInput: CheckoutFormInput = {
    name: 'Priya Sharma',
    phone: '9876543210',
    address: '221B Baker Colony, Andheri West, Mumbai',
};

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

describe('validateCheckoutForm', () => {
    it('returns no errors for a fully valid submission', () => {
        expect(validateCheckoutForm(validInput)).toEqual({});
    });

    it('requires a name', () => {
        const errors = validateCheckoutForm({ ...validInput, name: '  ' });
        expect(errors.name).toBeTruthy();
    });

    it('rejects an invalid phone number', () => {
        const errors = validateCheckoutForm({ ...validInput, phone: '123' });
        expect(errors.phone).toBeTruthy();
    });

    it('requires an address', () => {
        const errors = validateCheckoutForm({ ...validInput, address: '' });
        expect(errors.address).toBeTruthy();
    });

    it('rejects a too-short/incomplete address (failure case: just a city name)', () => {
        const errors = validateCheckoutForm({ ...validInput, address: 'Mumbai' });
        expect(errors.address).toBeTruthy();
    });
});
