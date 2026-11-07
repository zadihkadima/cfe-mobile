import { useEffect, useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";


import { useSelector } from "react-redux";

import { QueryState } from "@/core/components/QueryState";
import { RootState } from "@/core/store";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";

import { useFirmAdmins, useFirmSettings, useUpdateFirmSettings } from "../api/api";
import { FirmSettings } from "../api/types";

/**
 * The fields of the form, flattened.
 *
 * Address lines are held with a dotted key so the form stays one flat object;
 * they are split apart again on save, because the server writes address lines
 * individually and would erase the street if given a partial address object.
 */
const FIELDS: { key: string; label: string; keyboard?: "email-address" | "phone-pad" }[] = [
  { key: "name", label: "Firm name" },
  { key: "legal_name", label: "Legal name" },
  { key: "tax_id", label: "Tax ID / EIN" },
  { key: "email", label: "Email", keyboard: "email-address" },
  { key: "phone", label: "Phone", keyboard: "phone-pad" },
  { key: "website", label: "Website" },
];

const ADDRESS_FIELDS = [
  { key: "address.line1", label: "Address line 1" },
  { key: "address.line2", label: "Address line 2" },
  { key: "address.city", label: "City" },
  { key: "address.state", label: "State" },
  { key: "address.postal_code", label: "Postal code" },
  { key: "address.country", label: "Country" },
];

const NOMINEE_FIELDS: { key: string; label: string; keyboard?: "email-address" | "phone-pad" }[] = [
  { key: "nominee_name", label: "Nominee name" },
  { key: "nominee_email", label: "Nominee email", keyboard: "email-address" },
  { key: "nominee_phone", label: "Nominee phone", keyboard: "phone-pad" },
];

function flatten(settings: FirmSettings): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const { key } of FIELDS) {
    flat[key] = (settings as unknown as Record<string, string>)[key] ?? "";
  }

  for (const { key } of ADDRESS_FIELDS) {
    const part = key.split(".")[1] as keyof FirmSettings["address"];
    flat[key] = settings.address?.[part] ?? "";
  }

  for (const { key } of NOMINEE_FIELDS) {
    flat[key] = (settings as unknown as Record<string, string>)[key] ?? "";
  }

  return flat;
}

function Field({
  label,
  value,
  onChange,
  keyboard,
  editable,
}: {
  label: string;
  value: string;
  onChange(next: string): void;
  keyboard?: "email-address" | "phone-pad";
  editable: boolean;
}) {
  // Read here rather than taken as a prop. `theme` was referenced in the
  // placeholder colour below without ever being defined in this scope, which
  // is a compile error -- the screen could not have been built.
  const { theme } = useTheme();

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">
        {label}
      </Text>

      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard ?? "default"}
          autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.textMuted}
          placeholder="Not set"
          className="rounded-xl border border-border bg-background px-4 py-3 text-text dark:border-dark-border dark:bg-dark-background dark:text-dark-text"
        />
      ) : (
        // Non-admins see the same information as text rather than a disabled
        // input. A greyed-out box invites an edit that will never be allowed;
        // text says plainly that this is something to read.
        <Text className="text-base text-text dark:text-dark-text">
          {value || "Not set"}
        </Text>
      )}
    </View>
  );
}

export function SettingsScreen() {
  const { theme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, error, refetch } = useFirmSettings();
  const admins = useFirmAdmins(isAdmin);
  const update = useUpdateFirmSettings();

  const [form, setForm] = useState<Record<string, string>>({});
  const saved = useMemo(() => (data ? flatten(data) : {}), [data]);

  useEffect(() => {
    setForm(saved);
  }, [saved]);

  // Only what actually differs is sent. The server distinguishes "not sent"
  // from "sent as empty", so posting the whole form would overwrite any field
  // a colleague changed while this one sat open.
  const changed = Object.keys(form).filter((key) => form[key] !== saved[key]);

  const save = async () => {
    if (!changed.length) {
      return;
    }

    const payload: Record<string, unknown> = {};
    const address: Record<string, string> = {};

    for (const key of changed) {
      if (key.startsWith("address.")) {
        address[key.slice("address.".length)] = form[key];
      } else {
        payload[key] = form[key];
      }
    }

    if (Object.keys(address).length) {
      payload.address = address;
    }

    try {
      await update.mutateAsync(payload);
      Alert.alert("Saved", "Firm details updated.");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Unable to save. Please try again.";

      // The server names the field it refused, so that message is shown
      // rather than a generic failure the person would have to guess at
      // across nine fields.
      Alert.alert("Not saved", message);
    }
  };

  const set = (key: string) => (next: string) =>
    setForm((current) => ({ ...current, [key]: next }));

  return (
    <SharedLayout
      title="Settings"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
    >
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        <Text className="mb-4 text-lg font-bold text-text dark:text-dark-text">
          Firm
        </Text>

        {FIELDS.map(({ key, label, keyboard }) => (
          <Field
            key={key}
            label={label}
            value={form[key] ?? ""}
            onChange={set(key)}
            keyboard={keyboard}
            editable={isAdmin}
          />
        ))}

        <Text className="mb-4 mt-4 text-lg font-bold text-text dark:text-dark-text">
          Address
        </Text>

        {ADDRESS_FIELDS.map(({ key, label }) => (
          <Field
            key={key}
            label={label}
            value={form[key] ?? ""}
            onChange={set(key)}
            editable={isAdmin}
          />
        ))}

        <Text className="mb-1 mt-4 text-lg font-bold text-text dark:text-dark-text">
          Nominee
        </Text>
        <Text className="mb-4 text-sm text-text-secondary dark:text-dark-text-secondary">
          Contacted when nobody at the firm can be reached.
        </Text>

        {NOMINEE_FIELDS.map(({ key, label, keyboard }) => (
          <Field
            key={key}
            label={label}
            value={form[key] ?? ""}
            onChange={set(key)}
            keyboard={keyboard}
            editable={isAdmin}
          />
        ))}

        {isAdmin && (
          <>
            <Text className="mb-1 mt-4 text-lg font-bold text-text dark:text-dark-text">
              Administrators
            </Text>
            <Text className="mb-4 text-sm text-text-secondary dark:text-dark-text-secondary">
              Everyone who can change these settings.
            </Text>

            {(admins.data?.items ?? []).map((admin) => (
              <View
                key={admin.id}
                className="mb-2 rounded-xl border border-border bg-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface"
              >
                <Text className="font-semibold text-text dark:text-dark-text">
                  {`${admin.first_name} ${admin.last_name}`.trim() || admin.email}
                </Text>
                <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  {admin.email}
                </Text>
              </View>
            ))}

            {!admins.isLoading && !admins.data?.items.length && (
              <Text className="text-text-secondary dark:text-dark-text-secondary">
                No administrators found.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => void save()}
              // Disabled when nothing has changed, so pressing Save cannot
              // record an edit that changed nothing -- which would move the
              // audit trail and make a review of who touched what useless.
              disabled={!changed.length || update.isPending}
              accessibilityRole="button"
              accessibilityLabel="Save firm details"
              accessibilityState={{ disabled: !changed.length || update.isPending }}
              className={`mt-6 items-center rounded-xl bg-primary px-4 py-3.5 ${
                !changed.length || update.isPending ? "opacity-40" : ""
              }`}
            >
              <Text className="font-semibold text-white">
                {update.isPending
                  ? "Saving\u2026"
                  : changed.length
                    ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}`
                    : "Saved"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </QueryState>
    </SharedLayout>
  );
}
