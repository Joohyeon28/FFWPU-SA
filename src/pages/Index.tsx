import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import MemberCard from "@/components/directory/MemberCard";
import MemberProfileDialog from "@/components/directory/MemberProfileDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, X, Users, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MemberProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  extra_fields?: Array<{ title: string; value: string }>;
  family_name?: string;
  province?: string;
  country_of_birth?: string;
  category_of_member?: string;
  marital_status?: string;
  single_category?: string;
  tithing?: string;
}

interface FilterState {
  familyName: string;
  country: string;
  province: string;
  countryOfBirth: string;
  categoryOfMember: string;
  maritalStatus: string;
  gender: string;
  singleCategory: string;
  blessedChildGeneration: string;
  educationStatus: string;
  tithing: string;
  tithingType: string;
}

const Index = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    familyName: "",
    country: "",
    province: "",
    countryOfBirth: "",
    categoryOfMember: "",
    maritalStatus: "",
    gender: "",
    singleCategory: "",
    blessedChildGeneration: "",
    educationStatus: "",
    tithing: "",
    tithingType: "",
  });

  const ITEMS_PER_PAGE = 20;

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch members with React Query
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', currentPage, debouncedSearch, filters],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabaseClient
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('full_name', { ascending: true });

      if (debouncedSearch.trim()) {
        query = query.ilike('full_name', `%${debouncedSearch.trim()}%`);
      }

      if (filters.familyName) {
        query = query.ilike('family_name', `%${filters.familyName}%`);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.province) {
        query = query.eq('province', filters.province);
      }

      if (filters.countryOfBirth) {
        query = query.eq('country_of_birth', filters.countryOfBirth);
      }

      if (filters.categoryOfMember) {
        query = query.eq('category_of_member', filters.categoryOfMember);
      }

      if (filters.maritalStatus) {
        query = query.eq('marital_status', filters.maritalStatus);
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters.singleCategory) {
        query = query.eq('single_category', filters.singleCategory);
      }

      if (filters.blessedChildGeneration) {
        query = query.eq('blessed_child_generation', filters.blessedChildGeneration);
      }

      if (filters.educationStatus) {
        query = query.eq('education_status', filters.educationStatus);
      }

      if (filters.tithing) {
        query = query.eq('tithing', filters.tithing);
      }

      if (filters.tithingType) {
        query = query.eq('tithing_type', filters.tithingType);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return { members: data || [], total: count || 0 };
    },
    enabled: !!user,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const members = membersData?.members || [];
  const totalProfiles = membersData?.total || 0;
  const totalPages = Math.ceil(totalProfiles / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      familyName: "",
      country: "",
      province: "",
      countryOfBirth: "",
      categoryOfMember: "",
      maritalStatus: "",
      gender: "",
      singleCategory: "",
      blessedChildGeneration: "",
      educationStatus: "",
      tithing: "",
      tithingType: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleMemberClick = (member: MemberProfile) => {
    console.log('📋 Selected member data:', member);
    console.log('📋 Custom fields:', member.extra_fields);
    setSelectedMember(member);
    setShowProfileDialog(true);
  };

  const handleViewProfile = (userId: string) => {
    setShowProfileDialog(false);
    navigate(`/profile/${userId}`);
  };

  const handleSendMessage = async (userId: string) => {
    try {
      // Find the user's email to create a conversation
      const member = members.find(m => m.user_id === userId);
      if (!member) return;

      // Check if conversation already exists
      const { data: existingConvs } = await supabaseClient
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user!.id);

      const convIds = (existingConvs || []).map(c => c.conversation_id);

      if (convIds.length > 0) {
        // Check if there's a 1-on-1 conversation with this user
        const { data: targetConvs } = await supabaseClient
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId)
          .in('conversation_id', convIds);

        const sharedConvIds = (targetConvs || []).map(c => c.conversation_id);

        if (sharedConvIds.length > 0) {
          // Check if any of these are non-group conversations
          const { data: conversations } = await supabaseClient
            .from('conversations')
            .select('id, is_group')
            .in('id', sharedConvIds)
            .eq('is_group', false)
            .limit(1);

          if (conversations && conversations.length > 0) {
            // Navigate to existing conversation
            setShowProfileDialog(false);
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
          name: member.full_name,
          is_group: false,
          created_by: user!.id,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add members
      const { error: membersError } = await supabaseClient
        .from('conversation_members')
        .insert([
          { conversation_id: newConv.id, user_id: user!.id },
          { conversation_id: newConv.id, user_id: userId },
        ]);

      if (membersError) throw membersError;

      setShowProfileDialog(false);
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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalProfiles);

  // Show marketing page for non-authenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    );
  }

  // Show member directory for authenticated users
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-subtle">
        {/* Directory Hero */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 mb-12">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Member Directory</h1>
                <p className="text-white/80 text-lg">Connect with fellow members of our community</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 pb-12">
          {/* Search & Filter Section */}
          <div className="mb-8 space-y-4 animate-slide-up">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v !== "").length})`}
            </Button>
            </div>
          </div>

          {/* Filters Dialog */}
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-auto z-50">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle>Filter Members</DialogTitle>
                <DialogDescription>
                  Refine your search by applying filters
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Family Name</label>
                  <Input
                    placeholder="Filter by family name"
                    value={filters.familyName}
                    onChange={(e) => setFilters({ ...filters, familyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Country</label>
                  <Input
                    placeholder="Filter by country"
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Province</label>
                  <Input
                    placeholder="Filter by province"
                    value={filters.province}
                    onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Country of Birth</label>
                  <Input
                    placeholder="Filter by birth country"
                    value={filters.countryOfBirth}
                    onChange={(e) => setFilters({ ...filters, countryOfBirth: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category of Member</label>
                  <Select value={filters.categoryOfMember} onValueChange={(value) => setFilters({ ...filters, categoryOfMember: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full time member">Full time member</SelectItem>
                      <SelectItem value="Associate Member">Associate Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Gender</label>
                  <Select value={filters.gender} onValueChange={(value) => setFilters({ ...filters, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Marital Status</label>
                  <Select
                    value={filters.maritalStatus}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        maritalStatus: value,
                        singleCategory: value === "Single" ? filters.singleCategory : "",
                        blessedChildGeneration:
                          value === "Single" && filters.singleCategory === "Blessed Child"
                            ? filters.blessedChildGeneration
                            : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Matched">Matched</SelectItem>
                      <SelectItem value="Previously Married">Previously Married</SelectItem>
                      <SelectItem value="Blessed">Blessed</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filters.maritalStatus === "Single" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Single Category</label>
                    <Select
                      value={filters.singleCategory}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          singleCategory: value,
                          blessedChildGeneration:
                            value === "Blessed Child" ? filters.blessedChildGeneration : "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Generation">1st Generation</SelectItem>
                        <SelectItem value="Blessed Child">Blessed Child</SelectItem>
                        <SelectItem value="Jacobs Child">Jacobs Child</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filters.maritalStatus === "Single" && filters.singleCategory === "Blessed Child" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Blessed Child Generation</label>
                    <Select
                      value={filters.blessedChildGeneration}
                      onValueChange={(value) => setFilters({ ...filters, blessedChildGeneration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select generation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2nd Generation">2nd Generation</SelectItem>
                        <SelectItem value="3rd Generation">3rd Generation</SelectItem>
                        <SelectItem value="4th Generation">4th Generation</SelectItem>
                        <SelectItem value="5th Generation">5th Generation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Tithing</label>
                  <Select value={filters.tithing} onValueChange={(value) => setFilters({ ...filters, tithing: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tithing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Occasional">Occasional</SelectItem>
                      <SelectItem value="Not Currently">Not Currently</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tithing Type</label>
                  <Select value={filters.tithingType} onValueChange={(value) => setFilters({ ...filters, tithingType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Time">Time</SelectItem>
                      <SelectItem value="Holy Day Donation">Holy Day Donation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Education Status</label>
                  <Select value={filters.educationStatus} onValueChange={(value) => setFilters({ ...filters, educationStatus: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High School">High School</SelectItem>
                      <SelectItem value="Some College">Some College</SelectItem>
                      <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                      <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                      <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                      <SelectItem value="Doctoral Degree">Doctoral Degree</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-6 justify-end border-t mt-4">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalProfiles === 0 ? (
                "No members found"
              ) : (
                `Showing ${startIndex}–${endIndex} of ${totalProfiles} members`
              )}
            </p>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Member Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-lg">No members found</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
              {members.map((member) => (
                <MemberCard
                  key={member.user_id}
                  member={member}
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </div>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        member={selectedMember}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onSendMessage={handleSendMessage}
        onViewProfile={handleViewProfile}
        currentUserId={user.id}
      />
    </div>
  );
};

export default Index;
