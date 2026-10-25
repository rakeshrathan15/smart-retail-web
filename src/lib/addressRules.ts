import type { AddressInput } from '../api/types'

/** Checks the same rules as the backend; returns errors by field. */
export function addressErrors(a: AddressInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!a.fullName.trim()) errors.fullName = 'Enter a contact name'
  if (!/^[6-9]\d{9}$/.test(a.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (!a.addressLine1.trim()) errors.addressLine1 = 'Enter the address'
  if (!a.city.trim()) errors.city = 'Enter the city'
  if (!/^\d{6}$/.test(a.pincode.trim())) errors.pincode = 'Enter the 6-digit PIN code'
  return errors
}
