type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
};

const DEFAULT_AVATAR_URL = "/avatar_default.png";

export function UserAvatar({ src, name, size = "md" }: UserAvatarProps) {
  return (
    <img
      className={`user-avatar user-avatar-${size}`}
      src={src || DEFAULT_AVATAR_URL}
      alt={name ?? "Аватар пользователя"}
    />
  );
}