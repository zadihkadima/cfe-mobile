import { Text, View } from "react-native";

interface Props {
  count: number;
}

export function HeaderBadge({
  count,
}: Props) {
  if (count <= 0) {
    return null;
  }

  return (
    <View
      className="
absolute
-right-1
-top-1
min-w-[18px]
h-[18px]
px-1
rounded-full
bg-primary
items-center
justify-center
"
    >
      <Text
        className="
text-[10px]
font-bold
text-white
"
      >
        {count}
      </Text>
    </View>
  );
}