import { useQuery } from "@tanstack/react-query";

import { getManagers } from "../api/user.api";

export const useManagers = (
  page: number,
  search: string
) => {
  return useQuery({
    queryKey: [
      "managers",
      page,
      search,
    ],

    queryFn: async () => {
      const res = await getManagers({
        page,
        limit: 20,
        search,
        sort: "created_at",
        order: "desc",
      });

      return res.data;
    },
  });
};