import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "@/core/store";
import { clearNotification } from "@/core/store/notificationSlice";

export function GlobalNotification() {
  const dispatch = useDispatch();

  const notification = useSelector(
    (state: RootState) => state.notification.current,
  );

  useEffect(() => {
    if (!notification) return;

    const timeout = setTimeout(() => {
      dispatch(clearNotification());
    }, notification.durationMs ?? 3500);

    return () => clearTimeout(timeout);
  }, [dispatch, notification]);

  if (!notification) return null;

  const toneClass =
    notification.type === "error"
      ? "bg-danger dark:bg-dark-danger"
      : notification.type === "success"
      ? "bg-success dark:bg-dark-success"
      : "bg-info dark:bg-dark-info";

  return (
    <View className="absolute top-14 left-4 right-4 z-[9999]">
      <Pressable
        className={`rounded-2xl px-4 py-3 shadow-lg ${toneClass}`}
        onPress={() => dispatch(clearNotification())}
      >
        {!!notification.title && (
          <Text className="text-white font-bold text-sm">{notification.title}</Text>
        )}

        <Text className="text-white text-sm">{notification.message}</Text>
      </Pressable>
    </View>
  );
}
