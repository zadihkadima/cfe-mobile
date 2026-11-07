import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { RootState } from "@/core/store";
import { ListClientsResponse } from "@/modules/admin/api/client/types";
import { ListManagersResponse } from "@/modules/admin/api/manager/types";
import { useNotifications } from "@/modules/notification/hooks/useNotifications";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import { describeNotification } from "@/modules/notification/lib/describeNotification";
import { resolveEntityRoute } from "@/modules/notification/lib/notificationRoute";
import { usePinnedWorkspaces } from "@/modules/workspace/api/pins";
import { ListWorkspaceResponse } from "@/modules/workspace/api/types";

function relativeTime(dateString: string) {
	const target = new Date(dateString).getTime();
	const now = Date.now();
	const diffMinutes = Math.max(1, Math.floor((now - target) / 60000));

	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d ago`;
}

export function useDashboard() {
	const user = useSelector((state: RootState) => state.auth.user);
	const role = user?.role ?? "client";

	const workspacesQuery = useQuery({
		queryKey: queryKeys.workspaces.list({ page: 1, limit: 5 }),
		queryFn: async () => {
			const { data } = await api.get<ListWorkspaceResponse>("/workspaces", {
				params: { page: 1, limit: 5 },
			});
			return data;
		},
	});

	const managerTotalQuery = useQuery({
		queryKey: ["dashboard", "manager-total"],
		queryFn: async () => {
			const { data } = await api.get<ListManagersResponse>("/admin/managers", {
				params: { page: 1, limit: 1 },
			});
			return data.total;
		},
		enabled: role === "admin",
	});

	const clientTotalQuery = useQuery({
		queryKey: ["dashboard", "client-total"],
		queryFn: async () => {
			const { data } = await api.get<ListClientsResponse>("/admin/clients", {
				params: { page: 1, limit: 1 },
			});
			return data.total;
		},
		enabled: role === "admin",
	});

	// The activity feed is built from the notification list; the counts come
	// from the grouped endpoint, which is not capped the way the list is.
	const { data: notifications } = useNotifications();
	const unread = useUnread();

	const unreadMessageCount = unread.forKind("message");

	const cards = useMemo(() => {
		if (role === "admin") {
			return [
				{ label: "Managers", value: managerTotalQuery.data ?? 0 },
				{ label: "Clients", value: clientTotalQuery.data ?? 0 },
				{ label: "Workspaces", value: workspacesQuery.data?.total ?? 0 },
				{ label: "Unread Msgs", value: unreadMessageCount },
			];
		}

		return [
			{ label: "Workspaces", value: workspacesQuery.data?.total ?? 0 },
			{ label: "Unread Msgs", value: unreadMessageCount },
			{ label: "Unread Notifs", value: notifications?.unread ?? 0 },
			{ label: "Recent Events", value: notifications?.items?.length ?? 0 },
		];
	}, [
		role,
		managerTotalQuery.data,
		clientTotalQuery.data,
		workspacesQuery.data?.total,
		unreadMessageCount,
		notifications?.unread,
		notifications?.items?.length,
	]);

	const activities = (notifications?.items ?? []).slice(0, 5).map((item) => {
		// The same sentence the notification list shows. The feed used to
		// render the stored title, which is written for a push banner and so
		// names neither the person nor the workspace -- two rows reading
		// "Task updated" a minute apart told a reader nothing about whether
		// either concerned them.
		const { actor, action, workspace } = describeNotification(item);

		return {
			id: item.id,
			title: [actor, action].filter(Boolean).join(" "),
			subtitle: workspace,
			time: relativeTime(item.created_at),

			// The feed is built from notifications, so it can reuse the same
			// resolver the notification list uses. Writing the mapping out again
			// here would drift the first time an entity type was added to one and
			// not the other, and the symptom -- a row that ignores a tap -- would
			// look like a bug in this screen rather than a missing case.
			href: resolveEntityRoute(item, role),
		};
	});

	const { pinnedIds } = usePinnedWorkspaces();

	const recentWorkspaces = (workspacesQuery.data?.items ?? [])
		.map((item) => ({
			id: item.id,
			name: item.name,
			// Resolved by the server per request. Absent when the account has
			// been deleted, in which case the row simply omits the line -- the
			// identifier is never shown, because a hex string where a person's
			// name belongs reads as corrupted data.
			client: item.client_name ?? "",
			updated: relativeTime(item.updated_at),
			pinned: pinnedIds.has(item.id),
		}))
		// Pinned first, and otherwise the order the server gave. Sorting the
		// whole list by some other key as well would mean pinning a workspace
		// could move an unpinned one, which makes the pin look like it did
		// something it did not.
		.sort((a, b) => Number(b.pinned) - Number(a.pinned))
		.slice(0, 5);

	const actions =
		role === "admin"
			? [
					{ title: "Dashboard", href: "/user/admin" },
					{ title: "Managers", href: "/user/admin/managers" },
					{ title: "Clients", href: "/user/admin/clients" },
					{ title: "Workspaces", href: "/user/admin/workspaces" },
					{ title: "Notifications", href: "/user/notifications" },
				]
			: [
					{ title: "Dashboard", href: role === "manager" ? "/user/manager" : "/user/client" },
					{ title: "Workspaces", href: "/user/workspaces" },
					{ title: "Messages", href: "/user/messages" },
					{ title: "Notifications", href: "/user/notifications" },
				];

	// The workspace query is the only one every role depends on, so its failure
	// is what makes the dashboard meaningless. The admin-only totals are treated
	// the same way, but only when the caller is actually an admin.
	const isError =
		workspacesQuery.isError ||
		(role === "admin" && (managerTotalQuery.isError || clientTotalQuery.isError));

	const error =
		workspacesQuery.error ?? managerTotalQuery.error ?? clientTotalQuery.error;

	const refetch = () => {
		void workspacesQuery.refetch();
		if (role === "admin") {
			void managerTotalQuery.refetch();
			void clientTotalQuery.refetch();
		}
	};

	return {
		role,
		cards,
		actions,
		activities,
		recentWorkspaces,
		isLoading:
			workspacesQuery.isLoading ||
			(role === "admin" && (managerTotalQuery.isLoading || clientTotalQuery.isLoading)),
		isError,
		error,
		refetch,
	};
}
