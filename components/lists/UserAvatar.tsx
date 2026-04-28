type UserAvatarProps = {
  name: string | null | undefined;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "O";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1f4b3b,#2c6a52)] font-semibold text-white shadow-[0_8px_20px_-12px_rgba(20,40,30,0.5)]`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
