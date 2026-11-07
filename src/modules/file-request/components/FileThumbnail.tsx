import { Image, Text, View } from "react-native";
import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Film,
  ImageIcon,
} from "lucide-react-native";

import { Icon } from "@/design-system/ui";

interface Props {
  mimeType: string;
  originalName: string;

  /**
   * A short-lived link to a generated preview. Present only for still images,
   * so every other kind of file falls back to an icon rather than an empty
   * grey square that looks like a picture failing to load.
   */
  thumbnailUrl?: string;
}

function iconFor(mimeType: string, name: string) {
  const type = mimeType.toLowerCase();
  const extension = name.toLowerCase().split(".").pop() ?? "";

  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type === "application/pdf" || extension === "pdf") return FileText;

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["xls", "xlsx", "csv", "ods"].includes(extension)
  ) {
    return FileSpreadsheet;
  }

  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    ["zip", "gz", "7z", "rar", "tar"].includes(extension)
  ) {
    return FileArchive;
  }

  if (type.startsWith("text/") || ["doc", "docx", "rtf", "txt"].includes(extension)) {
    return FileText;
  }

  return FileIcon;
}

/**
 * A fixed-size preview for one file.
 *
 * The frame is the same size whether it holds a picture or an icon, so a list
 * does not reflow as thumbnails arrive -- rows shifting under a thumb that is
 * already moving toward one is how the wrong file gets opened.
 */
export function FileThumbnail({ mimeType, originalName, thumbnailUrl }: Props) {
  if (thumbnailUrl) {
    return (
      <Image
        source={{ uri: thumbnailUrl }}
        accessibilityLabel={`Preview of ${originalName}`}
        resizeMode="cover"
        className="h-12 w-12 rounded-lg bg-muted"
      />
    );
  }

  const Glyph = iconFor(mimeType, originalName);
  const isVideo = mimeType.toLowerCase().startsWith("video/");

  return (
    <View className="h-12 w-12 items-center justify-center rounded-lg border border-border bg-background dark:border-dark-border dark:bg-dark-background">
      <Icon as={Glyph} size="lg" tone="secondary" />

      {isVideo && (
        // Video has no generated poster, so the row says so rather than
        // showing a blank frame that reads as a preview which failed.
        <Text className="mt-0.5 text-[8px] font-semibold text-text-secondary dark:text-dark-text-secondary">
          VIDEO
        </Text>
      )}
    </View>
  );
}
