import { ReactNode } from "react";
import { View } from "react-native";

import clsx from "clsx";

import { Text } from "../typography/Text";
import { Button } from "../button/Button";

interface Props {

  /** Usually a lucide icon, sized around 28 and coloured `text-text-muted`. */
  icon?: ReactNode;

  /**
   * What is absent, stated plainly. "No documents requested" rather than
   * "Empty" — the user should not have to work out which list they are
   * looking at.
   */
  title: string;

  /**
   * Why it is empty, or what will fill it. Optional, but an empty state
   * without it tends to read as a dead end.
   */
  description?: string;

  /** Label for the primary action. Omitted when there is nothing to do here. */
  actionLabel?: string;

  onAction?(): void;

  className?: string;

}

/**
 * The state of a list that succeeded and returned nothing.
 *
 * The distinction this preserves is the important one. A failed request also
 * produces an empty array, and a screen that does not separate the two will
 * tell a user "No outstanding document requests" when the truth is that the
 * server could not be reached. On a tax platform, during a filing week, that is
 * not a cosmetic bug — the user acts on it and closes the app. `QueryState`
 * decides which state applies; this component only ever renders the genuine
 * one.
 *
 * An empty list is also the first thing a new user sees, so it is the wrong
 * place for a bare "Nothing here yet." Where an action exists that would fill
 * the list, offering it turns a dead end into the start of a path.
 */
export function EmptyState({

  icon,

  title,

  description,

  actionLabel,

  onAction,

  className,

}: Props) {

  return (

    <View

      className={clsx(

        "items-center",
        "justify-center",

        "gap-3",

        "px-8",
        "py-12",

        className,

      )}

    >

      {icon ? (

        <View

          className={clsx(

            "h-14",
            "w-14",

            "items-center",
            "justify-center",

            "rounded-full",

            "bg-surface-variant",
            "dark:bg-dark-surface-variant",

          )}

        >

          {icon}

        </View>

      ) : null}

      <Text

        variant="heading"

        className="text-center"

      >

        {title}

      </Text>

      {description ? (

        <Text

          className="text-center text-text-secondary dark:text-dark-text-secondary"

        >

          {description}

        </Text>

      ) : null}

      {actionLabel && onAction ? (

        <Button

          onPress={onAction}

          className="mt-2 px-6"

        >

          {actionLabel}

        </Button>

      ) : null}

    </View>

  );

}
