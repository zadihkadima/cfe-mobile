import { useCallback, useEffect, useRef } from "react";

import type {
  ReturnKeyTypeOptions,
  SubmitBehavior,
  TextInput,
} from "react-native";

type ChainedFieldProps = {
  ref: (instance: TextInput | null) => void;
  returnKeyType: ReturnKeyTypeOptions;
  submitBehavior: SubmitBehavior;
  onSubmitEditing: () => void;
};

type Options = {
  /**
   * Run when the last field is submitted. Usually the form's submit handler,
   * so finishing the final field completes the form rather than dropping the
   * reader back into it.
   */
  onSubmit?: () => void;
};

/**
 * Move to the next field when one is finished.
 *
 * Filling in a form on a phone otherwise means dismissing the keyboard,
 * finding the next box, tapping it, and waiting for the keyboard to come back
 * -- four actions between every pair of fields, on a screen where the keyboard
 * is covering half of what you are trying to reach.
 *
 * Usage:
 *
 *   const chain = useFieldChain(["email", "password"], { onSubmit: submit });
 *
 *   <Field label="Email" {...chain.field("email")} />
 *   <Field label="Password" {...chain.field("password")} />
 *
 * Two things are deliberately left to the caller:
 *
 * Multiline fields must not be chained. Their return key inserts a newline,
 * and taking that over means a description box that cannot hold a second
 * paragraph.
 *
 * Fields that are conditionally rendered should be left out of the list when
 * they are not shown, so the key above the keyboard reads "done" on what is
 * really the last field. Focus skips missing fields at runtime regardless, so
 * a field that disappears between render and tap dead-ends nothing.
 */
export function useFieldChain<Name extends string>(
  names: readonly Name[],
  options: Options = {},
) {
  const inputs = useRef(new Map<Name, TextInput>());

  /*
   * The order and the submit handler are mirrored into refs so that the
   * callbacks below can be created once and stay stable.
   *
   * Stability matters for the ref callback in particular: React invokes the
   * previous one with null and the next one with the instance whenever its
   * identity changes, so a callback rebuilt every render would detach and
   * reattach every field on every keystroke.
   */
  const order = useRef(names);
  const submit = useRef(options.onSubmit);

  useEffect(() => {
    order.current = names;
    submit.current = options.onSubmit;
  });

  // One registrar per name, cached, for the same stability reason.
  const registrars = useRef(new Map<Name, ChainedFieldProps["ref"]>());

  const register = useCallback((name: Name) => {
    const existing = registrars.current.get(name);

    if (existing) {
      return existing;
    }

    const registrar = (instance: TextInput | null) => {
      if (instance) {
        inputs.current.set(name, instance);
      } else {
        // Unmounted. Left in the map it would be focused after it had gone.
        inputs.current.delete(name);
      }
    };

    registrars.current.set(name, registrar);

    return registrar;
  }, []);

  const advance = useCallback((name: Name) => {
    const sequence = order.current;
    const position = sequence.indexOf(name);

    // Searches forward rather than stepping one place, so a field that is not
    // on screen is passed over instead of swallowing the jump.
    for (let next = position + 1; next < sequence.length; next += 1) {
      const input = inputs.current.get(sequence[next]);

      if (input) {
        input.focus();
        return;
      }
    }

    // Nothing further to fill in, so finishing here means finishing the form.
    submit.current?.();
  }, []);

  const field = useCallback(
    (name: Name): ChainedFieldProps => {
      const isLast = names.indexOf(name) === names.length - 1;

      return {
        ref: register(name),

        // The key above the keyboard says which of the two this is about to
        // do, so nobody has to submit a half-filled form to find out.
        returnKeyType: isLast ? "done" : "next",

        // "submit" fires the handler without blurring. Blurring first would
        // dismiss the keyboard and immediately raise it again for the next
        // field, which reads as the form flinching. The last field does blur,
        // because there is nothing left to type into.
        submitBehavior: isLast ? "blurAndSubmit" : "submit",

        onSubmitEditing: () => advance(name),
      };
    },
    [names, register, advance],
  );

  /** Put the cursor in a named field. Useful for focusing the first one. */
  const focus = useCallback((name: Name) => {
    inputs.current.get(name)?.focus();
  }, []);

  return { field, focus };
}
