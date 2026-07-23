export function isValidIndianMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return false;

  const last10 = digits.slice(-10);
  const prefix = digits.slice(0, -10);
  if (prefix && prefix !== '91' && prefix !== '0') return false;

  return /^[6-9]\d{9}$/.test(last10);
}

export interface ContactDetailsInput {
  name: string;
  phone: string;
  address: string;
}

export type ContactDetailsErrors = Partial<Record<'name' | 'phone', string>>;

/**
 * Name and phone are mandatory (the admin needs these to track the enquiry
 * in Admin → Orders) — address stays optional, since delivery details are
 * still worked out over WhatsApp, not collected on the site.
 */
export function validateContactDetails(input: ContactDetailsInput): ContactDetailsErrors {
  const errors: ContactDetailsErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Please enter your name.';
  }

  if (!isValidIndianMobile(input.phone)) {
    errors.phone = 'Please enter a valid 10-digit mobile number.';
  }

  return errors;
}
