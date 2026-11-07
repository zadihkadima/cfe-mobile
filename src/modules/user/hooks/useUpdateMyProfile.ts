import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useDispatch } from "react-redux";

import {
  getMyProfile,
  MyProfile,
  updateMyProfile,
  UpdateMyProfileRequest,
} from "@/modules/user/api/profile.api";
import { setUser } from "@/core/store/authSlice";

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (
      data: UpdateMyProfileRequest,
    ) => updateMyProfile(data),

    onSuccess: async () => {
      // Passing the query function matters: without it `fetchQuery` overwrites
      // the one the profile query registered and rejects, so a saved change
      // would report failure and never reach the header.
      const profile = await queryClient.fetchQuery<MyProfile>({
        queryKey: ["me"],
        queryFn: getMyProfile,
        staleTime: 0,
      });

      dispatch(setUser(profile));

      return profile;
    },
  });
};
