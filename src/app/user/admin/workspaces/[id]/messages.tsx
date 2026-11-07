import {
  useLocalSearchParams,
} from "expo-router";

import {
  WorkspaceMessageScreen,
} from "@/modules/message/screens/WorkspaceMessagesScreen";

import {
  tokenService,
} from "@/core/auth/tokenService";
import { RootState } from "@/core/store";
import { useSelector } from "react-redux";




export default function WorkspaceMessagesPage() {

  const {
    id,
  } = useLocalSearchParams<{
    id: string;
  }>();


   const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const token =
    tokenService.getAccessToken();


  if (
    !id ||
    !user ||
    !token
  ) {
    return null;
  }



  return (

    <WorkspaceMessageScreen

      workspaceId={
        id
      }


      token={
        token
      }


      currentUserId={
        user.id
      }

    />

  );
}
