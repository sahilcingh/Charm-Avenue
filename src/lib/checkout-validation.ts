export interface CheckoutFormInput {
    name: string;
    phone: string;
    address: string;
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormInput, string>>;

const MIN_ADDRESS_LENGTH = 10;

export function isValidIndianMobile(raw: string): boolean {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10) return false;

    const last10 = digits.slice(-10);
    const prefix = digits.slice(0, -10);
    if (prefix && prefix !== '91' && prefix !== '0') return false;

    return /^[6-9]\d{9}$/.test(last10);
}

export function validateCheckoutForm(input: CheckoutFormInput): CheckoutFormErrors {
    const errors: CheckoutFormErrors = {};

    if (!input.name.trim()) {
        errors.name = 'Please enter your name.';
    }

    if (!isValidIndianMobile(input.phone)) {
        errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    const trimmedAddress = input.address.trim();
    if (!trimmedAddress) {
        errors.address = 'Please enter a delivery address.';
    } else if (trimmedAddress.length < MIN_ADDRESS_LENGTH) {
        errors.address = 'Please enter a fuller delivery address, including area and city.';
    }

    return errors;
}
