import React from "react";
import { screen } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";

import { DashboardScreen } from "./DashboardScreen";

const mockUseDashboard = jest.fn();
const mockUseOutstandingWork = jest.fn();

jest.mock("../hooks/useDashboard", () => ({
  useDashboard: () => mockUseDashboard(),
}));

jest.mock("../hooks/useOutstandingWork", () => ({
  useOutstandingWork: () => mockUseOutstandingWork(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/dashboard",
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const dashboard = {
  role: "client",
  cards: [],
  actions: [],
  activities: [],
  recentWorkspaces: [],
  isLoading: false,
  isError: false,
  error: undefined,
  refetch: jest.fn(),
};

beforeEach(() => {
  mockUseDashboard.mockReturnValue(dashboard);
  mockUseOutstandingWork.mockReturnValue({ data: undefined });
});

describe("DashboardScreen", () => {
  /**
   * The section order is a deliberate decision, so it is asserted rather than
   * left to whoever edits this file next.
   *
   * Every other block answers "what exists". This one answers "what needs me",
   * which is why someone opens the app during a working day. The order used to
   * put platform statistics at the top and the actionable work three
   * screenfuls below it.
   */
  it("leads with outstanding work, above workspaces and statistics", async () => {
    await renderScreen(<DashboardScreen />);

    const headings = [
      "Needs Your Attention",
      "Recent Workspaces",
      "Quick Actions",
      "Recent Activity",
      "Overview",
    ];

    const positions = headings.map((heading) =>
      screen.getByText(heading),
    );

    expect(positions).toHaveLength(headings.length);

    // getAllByText returns document order, so comparing against the expected
    // sequence is what actually pins the order down.
    const rendered = screen
      .getAllByText(new RegExp(`^(${headings.join("|")})$`))
      .map((node) => node.props.children as string);

    expect(rendered).toEqual(headings);
  });

  /**
   * Outstanding work spans four modules and every workspace, so it is the
   * slowest request on the screen. Folding it into the loading gate would make
   * everything else arrive late for the sake of a section the reader has not
   * scrolled to yet.
   */
  it("renders the rest of the dashboard before outstanding work has arrived", async () => {
    mockUseOutstandingWork.mockReturnValue({ data: undefined });

    await renderScreen(<DashboardScreen />);

    expect(screen.getByText("Recent Workspaces")).toBeTruthy();
    expect(screen.getByText("Overview")).toBeTruthy();
  });

  it("summarises the outstanding counts once they arrive", async () => {
    mockUseOutstandingWork.mockReturnValue({
      data: {
        overdue: 2,
        due_soon: 5,
        assigned_to_me: 1,
        items: [],
      },
    });

    await renderScreen(<DashboardScreen />);

    // The three counts are the reason the section is at the top; a heading
    // with no numbers under it gives no reason to look.
    expect(screen.getByText(/2 overdue/)).toBeTruthy();
    expect(screen.getByText(/5 due this week/)).toBeTruthy();
    expect(screen.getByText(/1 assigned to you/)).toBeTruthy();
  });

  it("shows a retry rather than an empty dashboard when the load fails", async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboard,
      isError: true,
      error: new Error("offline"),
    });

    await renderScreen(<DashboardScreen />);

    // A dashboard of empty sections is indistinguishable from a firm with no
    // work in it, which is the one reading that must never be accidental.
    expect(screen.queryByText("Overview")).toBeNull();
  });

  it("does not render sections while the first load is in flight", async () => {
    mockUseDashboard.mockReturnValue({ ...dashboard, isLoading: true });

    await renderScreen(<DashboardScreen />);

    expect(screen.queryByText("Recent Workspaces")).toBeNull();
  });
});
