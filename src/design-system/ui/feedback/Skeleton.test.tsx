import React from "react";
import { render } from "@testing-library/react-native";

import { Skeleton, SkeletonList } from "./Skeleton";

/**
 * These assertions are deliberately about accessibility and structure rather
 * than about the animation.
 *
 * The pulse runs as a worklet on the UI thread, which does not exist under
 * Jest, so any assertion on the animated opacity would be testing Reanimated's
 * test double rather than this component. What is worth pinning down is that a
 * screen reader is told the region is busy — otherwise a loading list is
 * announced as a row of empty containers, which is indistinguishable from a
 * broken screen to anyone not looking at it.
 */
describe("Skeleton", () => {
  it("announces itself as loading rather than as empty content", async () => {
    const view = await render(<Skeleton className="h-4 w-32" />);

    expect(view.getByLabelText("Loading")).toBeTruthy();
  });

  it("renders one placeholder row per expected item", async () => {
    // The count is what stops the screen jumping when data lands, so a change
    // to it is a visible change and should not pass silently.
    const view = await render(<SkeletonList count={3} />);

    // Three rows, each with an avatar and two text lines.
    expect(view.getAllByLabelText("Loading")).toHaveLength(9);
  });
});
