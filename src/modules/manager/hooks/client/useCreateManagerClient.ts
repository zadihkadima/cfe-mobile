import { useRef } from "react";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { createManagerClient } from "@/modules/manager/api/client/api";

import { CreateManagerClientRequest } from "@/modules/manager/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";
import { newIdempotencyKey } from "@/core/api/idempotency";

export const useCreateManagerClient = () => {
  const queryClient = useQueryClient();

  // One key per mounted form, held in a ref so it survives re-renders. This is
  // the whole point of the mechanism: if the key were generated inside
  // mutationFn it would differ on every attempt and the server would treat each
  // retry as a new client. It is rotated after a success so that deliberately
  // creating a second client from the same open form is not mistaken for a
  // retry and silently answered with the first client's record.
  const idempotencyKey = useRef(newIdempotencyKey());

  return useMutation({
    mutationFn: (data: CreateManagerClientRequest) =>
      createManagerClient(data, idempotencyKey.current),

    onSuccess: () => {
      idempotencyKey.current = newIdempotencyKey();

      void queryClient.invalidateQueries({
        queryKey: queryKeys.managerClients.all,
      });
    },
  });
};
