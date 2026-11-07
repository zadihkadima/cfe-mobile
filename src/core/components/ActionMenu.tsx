import { Modal, Pressable, Text, View } from "react-native";

type ActionOption = {
  label: string;
  onPress(): void;
  destructive?: boolean;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: ActionOption[];
  onClose(): void;
};

export function ActionMenu({ visible, title, actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/20" onPress={onClose}>
        <View className="absolute right-4 top-28 w-64 rounded-3xl border border-border bg-white dark:border-dark-border dark:bg-dark-surface p-2 shadow-2xl">
          {title ? (
            <Text className="mb-2 px-3 text-sm font-semibold text-text dark:text-dark-text">
              {title}
            </Text>
          ) : null}
          {actions.map((action, index) => (
            <Pressable
              key={`action-menu-${index}`}
              onPress={() => {
                if (action.disabled) return;
                action.onPress();
                onClose();
              }}
              className={`rounded-2xl px-3 py-3 ${action.disabled ? "opacity-50" : ""}`}
            >
              <Text
                className={`text-text dark:text-dark-text ${action.destructive ? "text-danger" : ""}`}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
