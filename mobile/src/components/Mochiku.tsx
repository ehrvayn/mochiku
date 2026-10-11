import { Image } from "react-native";

export type Mood =
  | "idle"
  | "happy"
  | "worried"
  | "confused"
  | "thinking"
  | "sleeping";

const IMAGES: Record<Mood, number> = {
  idle: require("../../assets/images/MochikuPoses/Mochiku-idle.png"),
  happy: require("../../assets/images/MochikuPoses/Mochiku-happy.png"),
  worried: require("../../assets/images/MochikuPoses/Mochiku-worried.png"),
  confused: require("../../assets/images/MochikuPoses/Mochiku-confused.png"),
  thinking: require("../../assets/images/MochikuPoses/Mochiku-thinking.png"),
  sleeping: require("../../assets/images/MochikuPoses/Mochiku-sleeping.png"),
};

export default function Mochiku({
  mood = "idle",
  height,
  width,
}: {
  mood?: Mood;
  height?: number;
  width?: number;
}) {
  return (
    <Image
      source={IMAGES[mood]}
      style={{ width: width, height: height }}
      resizeMode="contain"
    />
  );
}
