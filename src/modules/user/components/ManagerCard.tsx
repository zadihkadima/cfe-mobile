//unused

import {
  TouchableOpacity,
  Text,
} from "react-native";

type Props = {
  manager: any;
  onPress: () => void;
};

export function ManagerCard({
  manager,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      className="p-[18px] bg-surface dark:bg-dark-surface mb-3 rounded-[10px] border border-border dark:border-dark-border"
      onPress={onPress}
    >
      <Text className="font-bold text-base text-text dark:text-dark-text">
        {manager.first_name} {manager.last_name}
      </Text>

      <Text className="text-text-secondary dark:text-dark-text-secondary">
        {manager.email}
      </Text>
    </TouchableOpacity>
  );
}