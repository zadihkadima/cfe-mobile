import { useQuery } from "@tanstack/react-query";

import { getMyProfile } from "@/modules/user/api/profile.api";

export const useMyProfile = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
  });
};
