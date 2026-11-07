import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

import {
  getMyProfile,
  MyProfile,
  uploadMyAvatar,
} from "@/modules/user/api/profile.api";
import { setUser } from "@/core/store/authSlice";

/**
 * Replaces the signed-in account's picture.
 *
 * The profile is refetched rather than patched locally because the server
 * decides the link, including its signature and expiry. Constructing one here
 * would mean guessing at a value only the server can produce.
 */
export const useUploadMyAvatar = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: uploadMyAvatar,

    onSuccess: async () => {
      /*
       * The query function is passed explicitly.
       *
       * `fetchQuery` does not inherit one from the cache -- it applies the
       * options it is given to the query, so calling it without a queryFn
       * replaced the one `useMyProfile` had registered and rejected with
       * "Missing queryFn". That happened after the upload had already
       * succeeded, which is why this failed so quietly: the picture reached
       * the server, the screen reported an error, and the dispatch below --
       * the only thing that updates the header and the message list -- never
       * ran.
       *
       * `invalidateQueries` beforehand was redundant with this and is gone;
       * `staleTime: 0` is what makes this call go past the copy in hand.
       */
      const profile = await queryClient.fetchQuery<MyProfile>({
        queryKey: ["me"],
        queryFn: getMyProfile,
        staleTime: 0,
      });

      // The header and drawer read the picture from the store, so without this
      // the new one appears on the profile screen and nowhere else.
      dispatch(setUser(profile));

      return profile;
    },
  });
};
