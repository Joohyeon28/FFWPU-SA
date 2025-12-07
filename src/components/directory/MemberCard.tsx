import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, User } from "lucide-react";

import { Shield } from "lucide-react";

interface MemberCardProps {
  member: {
    user_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    is_admin?: boolean;
  };
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-card hover:border-primary/30 transition-all duration-300 h-full border-t-4 border-t-primary/20 hover:border-t-primary bg-white hover:bg-gradient-to-br hover:from-white hover:to-primary/5 animate-slide-up"
      onClick={onClick}
    >
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex flex-col items-center text-center w-full overflow-hidden">
          <div className="relative mb-4">
            <Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-primary/10">
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center group/admin">
              {member.is_admin ? (
                <span className="relative group">
                  <Shield className="h-3 w-3 text-primary" fill="#facc15" />
                  <span className="absolute z-10 left-1/2 -translate-x-1/2 bottom-6 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Admin</span>
                </span>
              ) : (
                <User className="h-3 w-3 text-primary" />
              )}
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 w-full break-words text-foreground group-hover:text-primary transition-colors">
            {member.full_name}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 w-full justify-center min-h-fit">
            <Mail className="h-4 w-4 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-1 truncate text-xs">{member.email}</span>
          </div>

          {member.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 w-full break-words mt-auto pt-3 border-t border-primary/10">
              {member.bio}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
