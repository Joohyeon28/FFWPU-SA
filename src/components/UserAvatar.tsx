import React from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/profile";
import { fetchUserProfile } from "@/lib/profile";

type Props = {
  userId?: string;
  src?: string | null;
  className?: string;
  alt?: string;
};

const UserAvatar: React.FC<Props> = ({ userId: userIdProp, src, className, alt }) => {
  const { user } = useAuth();
  const userId = userIdProp || user?.id;
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => (userId ? fetchUserProfile(userId) : null),
    enabled: !!userId,
    // Use cached data if available so we don't flash empty state
    initialData: () => queryClient.getQueryData<UserProfile>(["userProfile", userId]),
    staleTime: 1000 * 60 * 5,
  });

  const avatarSrc = src ?? profile?.avatar_url ?? "";
  const name = profile?.full_name ?? profile?.name ?? user?.email ?? "?";

  return (
    <Avatar className={className}>
      {avatarSrc ? (
        <AvatarImage src={avatarSrc} alt={alt || name} />
      ) : (
        <AvatarFallback>{
          name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        }</AvatarFallback>
      )}
    </Avatar>
  );
};

export default UserAvatar;
