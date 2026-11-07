export type FirmAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type FirmSettings = {
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  website: string;
  address: FirmAddress;
  nominee_name: string;
  nominee_email: string;
  nominee_phone: string;
  updated_at?: string;
};

/**
 * What may be sent when saving.
 *
 * Every field is optional, and the server treats absent and empty as different
 * things, so a screen that edits one field must send only that field. Sending
 * the whole object back would overwrite anything a colleague changed while the
 * form was open.
 */
export type FirmSettingsUpdate = Partial<
  Omit<FirmSettings, "address" | "updated_at">
> & {
  address?: Partial<FirmAddress>;
};

export type FirmAdmin = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
  created_at?: string;
};
