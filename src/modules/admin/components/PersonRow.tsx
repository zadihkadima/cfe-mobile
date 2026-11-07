import React from "react";

import { View, Pressable, Text } from "react-native";
import { useToast } from "@/design-system/ui";

import { Avatar, Badge, ListItem } from "@/design-system/ui";

type Person = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  invited: boolean;

  /**
   * A link to this person's picture, absent when they have not set one.
   *
   * Optional rather than required because most accounts never upload one, and
   * the avatar falls back to initials -- so absence is a rendering choice, not
   * a missing field.
   */
  avatar_url?: string;
};

type Props = {
  person: Person;
  onPress: () => void;
  onResend?: (id: string) => Promise<void>;
};

/**
 * One person in a list, whether client or manager.
 *
 * ClientCard and ManagerCard were byte-for-byte identical apart from the word
 * "client" or "manager", so a change to one silently left the other behind.
 * Both are people with a name, an email and the same two states; the type
 * below says exactly that and nothing more, so this row does not need to know
 * which it is rendering.
 *
 * Status was previously body text — "Status: Active", "Invited: No" — at the
 * same weight as the person's name, so a list of people read as a wall of
 * words with the names no longer standing out. Stating the field name on every
 * row also repeats what the reader already knows in order to say the one word
 * that differs.
 */
export function PersonRow({ person, onPress, onResend }: Props) {
  const name = `${person.first_name} ${person.last_name}`.trim();
  const toast = useToast();

  const resendInvitation = async () => {
    if (!person.id || !onResend) {
      toast.show("No id available to resend invitation", { tone: "warning" });
      return;
    }

    try {
      await onResend(person.id);
      toast.show("Invitation resent", { tone: "success" });
    } catch {
      toast.show("Failed to resend invitation", { tone: "danger" });
    }
  };

  return (
    <ListItem
      // An invited user may not have supplied a name yet, and a row titled
      // " " is indistinguishable from a broken record.
      title={name || person.email}
      subtitle={name ? person.email : undefined}
      onPress={onPress}
      leading={
        <Avatar name={name || person.email} image={person.avatar_url} />
      }
      trailing={
        <View className="items-end gap-1">
          {/*
            Only the states worth acting on are drawn. An active, registered
            user is the norm, and a badge on every row saying so is noise that
            makes the exceptions harder to spot — which is the entire reason
            for showing status at all.
          */}
          {!person.is_active ? (
            <Badge label="Inactive" tone="danger" />
          ) : null}

          {person.invited ? (
            <View className="flex-row items-center">
              <Badge label="Invited" tone="warning" />
              {onResend ? (
                <Pressable
                  onPress={() => void resendInvitation()}
                  className="ml-3 px-2 py-1"
                >
                  <Text className="text-sm font-semibold text-primary">Resend</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      }
    />
  );
}
