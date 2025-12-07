import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MemberProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  phone_country_code?: string;
  family_name?: string;
  gender?: string;
  country?: string;
  province?: string;
  country_of_birth?: string;
  category_of_member?: string;
  tithing?: string;
  tithing_type?: string;
  marital_status?: string;
  single_category?: string;
  blessed_child_generation?: string;
  parents_blessing_group?: string;
  spouse_name?: string;
  date_of_marriage?: string;
  blessing_group?: string;
  date_of_blessing?: string;
  ascension_date?: string;
  seonghwa_date?: string;
  education_status?: string;
  education_degree_status?: string;
  education_degree?: string;
  education_institution?: string;
  extra_fields?: Array<{ title: string; value: string }>;
}

interface MemberProfileDialogProps {
  member: MemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  currentUserId: string;
}

const MemberProfileDialog = ({ 
  member, 
  open, 
  onOpenChange, 
  onSendMessage,
  onViewProfile,
  currentUserId 
}: MemberProfileDialogProps) => {
  if (!member) return null;

  console.log('🔍 Member in dialog:', member);
  console.log('🔍 extra_fields type:', Array.isArray(member.extra_fields) ? 'array' : typeof member.extra_fields);
  console.log('🔍 extra_fields value:', member.extra_fields);
  console.log('🔍 extra_fields count:', member.extra_fields ? member.extra_fields.length : 'no extra_fields');

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = member.user_id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="sr-only">Member Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 w-full overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center py-6 border-b w-full">
            <Avatar className="h-32 w-32 mb-4 flex-shrink-0">
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold mb-2 line-clamp-3 px-4">{member.full_name}</h2>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 w-full">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Information
            </h3>
            
            <div className="grid gap-3 pl-7 w-full">
              <div className="flex items-start gap-3 w-full overflow-x-hidden">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground break-words">{member.email}</p>
                </div>
              </div>

              {member.phone_number && (
                <div className="flex items-start gap-3 w-full overflow-x-hidden">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {member.phone_country_code && `${member.phone_country_code} `}
                      {member.phone_number}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Short Introduction */}
          {member.bio && (
            <>
              <Separator />
              <div className="space-y-4 w-full">
                <h3 className="font-semibold text-lg">Short Introduction</h3>
                <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap px-2">
                  {member.bio}
                </p>
              </div>
            </>
          )}


          {/* Action Buttons */}
          <Separator />
          <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
            <Button 
              onClick={() => onViewProfile(member.user_id)}
              variant="outline"
              className="flex-1"
            >
              View Full Profile
            </Button>
            {!isOwnProfile && (
              <Button 
                onClick={() => onSendMessage(member.user_id)}
                className="flex-1"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberProfileDialog;
