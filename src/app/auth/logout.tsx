import { useEffect } from "react";
import {
  View,
  Text,
} from "react-native";
import { endSession } from "@/core/auth/endSession";

import { Spinner } from "@/design-system/ui/feedback/Spinner";

export default function LogoutScreen() {
  /*
   * The shared teardown, rather than a third copy of it.
   *
   * This used to clear the tokens and the store itself, which meant it never
   * revoked the session on the server and never withdrew this handset from
   * push -- so the next person to sign in here would have received the
   * previous one's notifications.
   *
   * endSession redirects as well, so there is nothing left to do afterwards.
   */
  useEffect(() => {
    endSession();
  }, []);

  return (
    <View className="flex-1 justify-center items-center p-6 bg-background dark:bg-dark-background"> 
      <View className="w-full max-w-[420px] rounded-[20px] p-7 border border-border dark:border-dark-border items-center shadow-lg bg-surface dark:bg-dark-surface"> 
        <Text className="text-2xl font-bold mb-2 text-text dark:text-dark-text">Signing out</Text>
        <Text className="text-base font-medium text-center text-text-secondary dark:text-dark-text-secondary">Redirecting to login...</Text>
        <View className="mt-6">
          <Spinner size={36} label="Signing out" />
        </View>
      </View>
    </View>
  );
}
