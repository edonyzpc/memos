import { cn } from "@/lib/utils";

interface Props {
  avatarUrl?: string;
  className?: string;
}

const DEFAULT_AVATAR_SIZE = 64;

const UserAvatar = (props: Props) => {
  const { avatarUrl, className } = props;
  const src = avatarUrl || "/avatar.jpeg";
  return (
    <div className={cn(`w-8 h-8 overflow-clip rounded-xl border border-border`, className)}>
      <img
        className="w-full h-auto shadow min-w-full min-h-full object-cover"
        src={src}
        width={DEFAULT_AVATAR_SIZE}
        height={DEFAULT_AVATAR_SIZE}
        decoding="async"
        loading="lazy"
        alt=""
      />
    </div>
  );
};

export default UserAvatar;
