import { forwardRef, useImperativeHandle } from "react";

import { render, screen } from "@testing-library/react-native";

import { TextInput, View } from "react-native";

import { useFieldChain } from "./useFieldChain";

/**
 * Records what the chain focused, which is its only observable effect -- it
 * renders nothing of its own.
 *
 * The ref is taken over with `useImperativeHandle` because a test renderer
 * gives host components no real native instance, so there would otherwise be
 * no `focus` to watch.
 */
const focused: string[] = [];

const StubField = forwardRef<TextInput, { name: string }>(function StubField(
  { name, ...props },
  ref,
) {
  useImperativeHandle(
    ref,
    () => ({ focus: () => focused.push(name) }) as unknown as TextInput,
    [name],
  );

  return <TextInput accessibilityLabel={name} {...props} />;
});

function Form({
  names,
  present = names,
  onSubmit,
}: {
  names: readonly string[];
  present?: readonly string[];
  onSubmit?: () => void;
}) {
  const chain = useFieldChain(names, { onSubmit });

  return (
    <View>
      {names.map((name) =>
        present.includes(name) ? (
          <StubField key={name} name={name} {...chain.field(name)} />
        ) : null,
      )}
    </View>
  );
}

function field(name: string) {
  return screen.getByLabelText(name);
}

/** Finishing a field, as the return key on the keyboard would. */
function finish(name: string) {
  field(name).props.onSubmitEditing();
}

beforeEach(() => {
  focused.length = 0;
});

describe("moving to the next field", () => {
  // The key above the keyboard is the only warning of what finishing a field
  // will do. Saying "done" on a field that continues, or "next" on one that
  // submits, is a promise the form then breaks.
  it("labels the keyboard key with what will actually happen", async () => {
    await render(<Form names={["a", "b", "c"]} />);

    expect(field("a").props.returnKeyType).toBe("next");
    expect(field("b").props.returnKeyType).toBe("next");
    expect(field("c").props.returnKeyType).toBe("done");
  });

  // Blurring before focusing the next field dismisses the keyboard and raises
  // it again, which reads as the form flinching between every pair of fields.
  it("does not drop the keyboard between fields", async () => {
    await render(<Form names={["a", "b"]} />);

    expect(field("a").props.submitBehavior).toBe("submit");
  });

  it("puts the keyboard away on the last field", async () => {
    await render(<Form names={["a", "b"]} />);

    expect(field("b").props.submitBehavior).toBe("blurAndSubmit");
  });

  it("focuses the following field", async () => {
    await render(<Form names={["a", "b"]} />);

    finish("a");

    expect(focused).toEqual(["b"]);
  });

  it("submits the form from the last field", async () => {
    const onSubmit = jest.fn();

    await render(<Form names={["a", "b"]} onSubmit={onSubmit} />);

    finish("b");

    expect(onSubmit).toHaveBeenCalled();
    expect(focused).toEqual([]);
  });

  // A field that is conditionally hidden would otherwise swallow the jump,
  // leaving the reader stranded on a field whose key says "next".
  it("passes over a field that is not on screen", async () => {
    await render(<Form names={["a", "b", "c"]} present={["a", "c"]} />);

    finish("a");

    expect(focused).toEqual(["c"]);
  });

  // Nothing left to fill in means the form is finished, however many of the
  // remaining fields happen to be hidden.
  it("submits when everything after the current field is absent", async () => {
    const onSubmit = jest.fn();

    await render(
      <Form names={["a", "b", "c"]} present={["a"]} onSubmit={onSubmit} />,
    );

    finish("a");

    expect(onSubmit).toHaveBeenCalled();
  });

  it("does nothing worse than stopping when there is no submit handler", async () => {
    await render(<Form names={["a"]} />);

    expect(() => finish("a")).not.toThrow();
  });

  // A field removed after the first render must not still be focused.
  it("forgets a field once it leaves the screen", async () => {
    const view = await render(<Form names={["a", "b", "c"]} />);

    await view.rerender(<Form names={["a", "b", "c"]} present={["a", "c"]} />);

    finish("a");

    expect(focused).toEqual(["c"]);
  });

  /*
   * React detaches and reattaches a ref whenever the callback's identity
   * changes. A chain that rebuilt its registrars every render would tear down
   * every field on every keystroke, and the map it focuses through would be
   * empty for part of each frame.
   */
  it("keeps the same registration callback across renders", async () => {
    const view = await render(<Form names={["a", "b"]} />);

    const before = field("a").props.ref;

    await view.rerender(<Form names={["a", "b"]} />);

    expect(field("a").props.ref).toBe(before);
  });
});
