import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
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
  family_photo_url?: string;
  children_names?: string[];
  extra_fields?: Array<{ title: string; value: string }>;
}

const Profile = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch profile with React Query
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      console.log('👤 Full profile data:', data);
      console.log('👤 Extra fields:', data?.extra_fields);
      console.log('👤 Extra fields structure:', JSON.stringify(data?.extra_fields, null, 2));
      
      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  const handleSendMessage = async () => {
    if (!user || !profile) return;

    try {
      // Check if conversation already exists
      const { data: existingConvs } = await supabaseClient
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      const convIds = (existingConvs || []).map(c => c.conversation_id);

      if (convIds.length > 0) {
        const { data: targetConvs } = await supabaseClient
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', profile.user_id)
          .in('conversation_id', convIds);

        const sharedConvIds = (targetConvs || []).map(c => c.conversation_id);

        if (sharedConvIds.length > 0) {
          const { data: conversations } = await supabaseClient
            .from('conversations')
            .select('id, is_group')
            .in('id', sharedConvIds)
            .eq('is_group', false)
            .limit(1);

          if (conversations && conversations.length > 0) {
            navigate('/messages');
            return;
          }
        }
      }

      // Create new conversation
      const now = new Date().toISOString();
      const { data: newConv, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          name: profile.full_name,
          is_group: false,
          created_by: user.id,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (convError) throw convError;

      const { error: membersError } = await supabaseClient
        .from('conversation_members')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: profile.user_id },
        ]);

      if (membersError) throw membersError;

      navigate('/messages');
      toast({
        title: "Success",
        description: "Conversation created",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start conversation",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Profile not found</p>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-subtle">
        <div className="container max-w-4xl py-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>

          {/* Profile Header */}
          <Card className="mb-6 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                <Avatar className="h-32 w-32 flex-shrink-0 ring-4 ring-primary/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left w-full min-w-0">
                  <h1 className="text-3xl font-bold mb-2 break-words overflow-wrap break-all text-primary">{profile.full_name}</h1>
                  {profile.bio && (
                    <p className="text-muted-foreground text-lg mb-4 break-words overflow-wrap break-all whitespace-pre-wrap">{profile.bio}</p>
                  )}

                  {!isOwnProfile && (
                    <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-card" onClick={handleSendMessage}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              <div className="flex items-start gap-3 w-full overflow-hidden rounded-lg border border-primary/10 bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm font-semibold text-primary">Email</p>
                  <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.email}</p>
                </div>
              </div>

              {profile.phone_number && (
                <div className="flex items-start gap-3 w-full overflow-hidden rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="text-sm font-semibold text-primary">Phone</p>
                    <p className="text-sm text-foreground break-words overflow-wrap break-all">
                      {profile.phone_country_code}{profile.phone_number}
                    </p>
                  </div>
                </div>
              )}

              {profile.country && (
                <div className="flex items-start gap-3 w-full overflow-hidden rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="text-sm font-semibold text-primary">Location</p>
                    <p className="text-sm text-foreground break-words overflow-wrap break-all">
                      {[profile.province, profile.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Information */}
          {(profile.education_status || profile.category_of_member || profile.gender || profile.country_of_birth || profile.education_degree_status || profile.education_degree || profile.education_institution || profile.tithing || profile.tithing_type) && (
            <Card className="mb-6 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 w-full">
                  {profile.gender && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Gender</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.gender}</p>
                    </div>
                  )}
                  {profile.category_of_member && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Category of Member</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.category_of_member}</p>
                    </div>
                  )}
                  {profile.country_of_birth && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Country of Birth</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.country_of_birth}</p>
                    </div>
                  )}
                  {profile.education_status && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Education Status</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.education_status}</p>
                    </div>
                  )}
                  {profile.education_degree_status && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Degree Status</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.education_degree_status}</p>
                    </div>
                  )}
                  {profile.education_degree && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Degree</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.education_degree}</p>
                    </div>
                  )}
                  {profile.education_institution && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Institution</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.education_institution}</p>
                    </div>
                  )}
                  {profile.tithing && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Tithing</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.tithing}</p>
                    </div>
                  )}
                  {profile.tithing_type && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Tithing Type</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.tithing_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marital Status Information */}
          {profile.marital_status && (
            <Card className="mb-6 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">Marital Status Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 w-full">
                  <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                    <p className="text-sm font-semibold text-primary">Marital Status</p>
                    <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.marital_status}</p>
                  </div>
                  {profile.single_category && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Single Category</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.single_category}</p>
                    </div>
                  )}
                  {profile.blessed_child_generation && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Generation</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.blessed_child_generation}</p>
                    </div>
                  )}
                  {profile.parents_blessing_group && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Parents' Blessing Group</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.parents_blessing_group}</p>
                    </div>
                  )}
                  {profile.spouse_name && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Spouse Name</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.spouse_name}</p>
                    </div>
                  )}
                  {profile.date_of_marriage && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Date of Marriage</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">
                        {new Date(profile.date_of_marriage).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {profile.blessing_group && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Blessing Group</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.blessing_group}</p>
                    </div>
                  )}
                  {profile.date_of_blessing && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Date of Blessing</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">
                        {new Date(profile.date_of_blessing).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {profile.ascension_date && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Ascension Date</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">
                        {new Date(profile.ascension_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {profile.seonghwa_date && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Seonghwa Date</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">
                        {new Date(profile.seonghwa_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {profile.children_names && profile.children_names.length > 0 && (
                    <div className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-primary">Children's Names</p>
                      <p className="text-sm text-foreground break-words overflow-wrap break-all">{profile.children_names.join(', ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.family_photo_url && (
            <Card className="mb-6 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">Family Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-primary/10 bg-white/70 flex justify-center">
                  <img
                    src={profile.family_photo_url}
                    alt="Family"
                    className="max-h-[32rem] w-full h-auto object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom/Extra Fields */}
          {profile.extra_fields && Array.isArray(profile.extra_fields) && profile.extra_fields.length > 0 && (
            <Card className="shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 w-full">
                  {profile.extra_fields.map((field, index) => {
                    // Skip empty values
                    if (!field.value || field.value.trim() === '') return null;
                    
                    return (
                      <div key={index} className="space-y-1 overflow-hidden min-w-0 rounded-lg border border-primary/10 bg-white/70 p-3">
                        <p className="text-sm font-semibold text-primary">
                          {field.title}
                        </p>
                        <p className="text-sm text-foreground break-words overflow-wrap break-all">
                          {field.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
