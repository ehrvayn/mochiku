import { Text } from "react-native";

const isWordChar = (value: string | undefined) =>
  value !== undefined && /[\p{L}\p{N}]/u.test(value);

function findNameIndex(message: string, name: string) {
  let from = 0;

  while (from <= message.length - name.length) {
    const at = message.indexOf(name, from);
    if (at === -1) return -1;

    const before = message[at - 1];
    const after = message[at + name.length];
    if (!isWordChar(before) && !isWordChar(after)) return at;

    from = at + name.length;
  }

  return -1;
}

export default function MascotMessage({
  message,
  name,
  className,
}: {
  message: string;
  name?: string | null;
  className?: string;
}) {
  const highlighted = name?.trim();
  const at = highlighted ? findNameIndex(message, highlighted) : -1;

  if (!highlighted || at === -1) {
    return <Text className={className}>{message}</Text>;
  }

  return (
    <Text className={className}>
      {message.slice(0, at)}
      <Text className="font-display text-base">{highlighted}</Text>
      {message.slice(at + highlighted.length)}
    </Text>
  );
}
