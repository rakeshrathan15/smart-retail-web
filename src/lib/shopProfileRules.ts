/** The shop profile form, as text while typing. */
export interface ShopProfileForm {
  shopName: string
  ownerName: string
  phone: string
  gstNumber: string
  address: string
  city: string
  pincode: string
  location: { lat: number; lng: number } | null
}

/** Same rules as the backend (ShopProfileController); returns errors by field. */
export function shopProfileErrors(f: ShopProfileForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!f.shopName.trim()) errors.shopName = 'Enter the shop name'
  if (!f.ownerName.trim()) errors.ownerName = 'Enter the owner name'
  if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (f.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(f.gstNumber.trim())) {
    errors.gstNumber = 'A GSTIN has 15 characters, e.g. 36ABCDE1234F1Z5'
  }
  if (!f.address.trim()) errors.address = 'Enter the shop address'
  if (!f.city.trim()) errors.city = 'Enter the city'
  if (!/^\d{6}$/.test(f.pincode.trim())) errors.pincode = 'Enter the 6-digit PIN code'
  if (!f.location) errors.location = 'Place the pin on your shop'
  else if (f.location.lat < 6 || f.location.lat > 37.5 || f.location.lng < 68 || f.location.lng > 98) {
    errors.location = 'The pin must be in India'
  }
  return errors
}
