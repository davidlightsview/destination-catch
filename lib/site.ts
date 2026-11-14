// Business details shown on the legal pages. Set SELLER_NAME and CONTACT_EMAIL in Vercel.
export const SELLER = process.env.SELLER_NAME || 'Destination Catch';
export const CONTACT = process.env.CONTACT_EMAIL || '';
export const PIXEL_ON = !!process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const UPDATED = '15 November 2026';
