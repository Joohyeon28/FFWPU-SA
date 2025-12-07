import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseStorage } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile, updateUserProfile } from "@/lib/profile";
import { Users, User, Settings, LogOut, Mail, Home, MessageSquare, CalendarDays, Camera, X } from "lucide-react";

const ProfileEdit = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => (user ? fetchUserProfile(user.id) : null),
    enabled: !!user,
  });

  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [countryOfBirth, setCountryOfBirth] = useState("");
  const [categoryOfMember, setCategoryOfMember] = useState("");
  const [tithing, setTithing] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [singleCategory, setSingleCategory] = useState("");
  const [blessedChildGeneration, setBlessedChildGeneration] = useState("");
  const [parentsBlessingGroup, setParentsBlessingGroup] = useState("");
  const [childrenNames, setChildrenNames] = useState<string[]>([]);
  const [spouseName, setSpouseName] = useState("");
  const [dateOfMarriage, setDateOfMarriage] = useState("");
  const [blessingGroup, setBlessingGroup] = useState("");
  const [dateOfBlessing, setDateOfBlessing] = useState("");
  const [ascensionDate, setAscensionDate] = useState("");
  const [seonghwaDate, setSeonghwaDate] = useState("");
  const [educationStatus, setEducationStatus] = useState("");
  const [educationDegreeStatus, setEducationDegreeStatus] = useState("");
  const [educationDegree, setEducationDegree] = useState("");
  const [educationInstitution, setEducationInstitution] = useState("");
  const [tithingType, setTithingType] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+27");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState("");
  const [familyPhotoFile, setFamilyPhotoFile] = useState<File | null>(null);
  const [uploadingFamilyPhoto, setUploadingFamilyPhoto] = useState(false);
  const [fields, setFields] = useState<Array<{ id: string; title: string; value: string }>>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setFamilyName(profile.family_name || "");
      setBio(profile.bio || "");
      setPhoneNumber(profile.phone_number || "");
      setDateOfBirth(profile.date_of_birth || "");
      setGender(profile.gender || "");
      setCountry(profile.country || "");
      setProvince(profile.province || "");
      setCountryOfBirth(profile.country_of_birth || "");
      setCategoryOfMember(profile.category_of_member || "");
      setTithing(profile.tithing || "");
      setMaritalStatus(profile.marital_status || "");
      setSingleCategory(profile.single_category || "");
      setBlessedChildGeneration(profile.blessed_child_generation || "");
      setParentsBlessingGroup(profile.parents_blessing_group || "");
      setChildrenNames(profile.children_names || []);
      setSpouseName(profile.spouse_name || "");
      setDateOfMarriage(profile.date_of_marriage || "");
      setBlessingGroup(profile.blessing_group || "");
      setDateOfBlessing(profile.date_of_blessing || "");
      setAscensionDate(profile.ascension_date || "");
      setSeonghwaDate(profile.seonghwa_date || "");
      setEducationStatus(profile.education_status || "");
      setEducationDegreeStatus(profile.education_degree_status || "");
      setEducationDegree(profile.education_degree || "");
      setEducationInstitution(profile.education_institution || "");
      setTithingType(profile.tithing_type || "");
      setPhoneCountryCode(profile.phone_country_code || "+27");
      setAvatarUrl(profile.avatar_url || "");
      setFamilyPhotoUrl(profile.family_photo_url || "");
      setFields((profile.extra_fields || []).map((f, i) => ({ id: String(i), title: f.title, value: f.value })));
    }
  }, [profile]);

  // Handle scrolling to section when query parameter is present
  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "additional-information") {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById("additional-information-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let finalAvatarUrl = avatarUrl || undefined;
      if (avatarFile && avatarUrl.startsWith("blob:")) {
        const fileExt = avatarFile.name.split(".")?.pop() || "jpg";
        const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseStorage
          .from("avatars")
          .upload(storagePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data } = supabaseStorage.from("avatars").getPublicUrl(storagePath);
        finalAvatarUrl = data.publicUrl;
        setAvatarUrl(finalAvatarUrl);
      }

      let finalFamilyPhotoUrl = familyPhotoUrl || undefined;
      if (familyPhotoFile && familyPhotoUrl.startsWith("blob:")) {
        const fileExt = familyPhotoFile.name.split(".")?.pop() || "jpg";
        const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseStorage
          .from("family-photos")
          .upload(storagePath, familyPhotoFile);
        if (uploadError) throw uploadError;
        const { data } = supabaseStorage.from("family-photos").getPublicUrl(storagePath);
        finalFamilyPhotoUrl = data.publicUrl;
        setFamilyPhotoUrl(finalFamilyPhotoUrl || "");
      }

      const payload: any = {
        full_name: name || null,
        family_name: familyName || null,
        bio: bio || null,
        phone_number: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        country: country || null,
        province: province || null,
        country_of_birth: countryOfBirth || null,
        category_of_member: categoryOfMember || null,
        tithing: tithing || null,
        marital_status: maritalStatus || null,
        single_category: maritalStatus === "Single" ? (singleCategory || null) : null,
        blessed_child_generation: (maritalStatus === "Single" && singleCategory === "Blessed Child") ? (blessedChildGeneration || null) : null,
        parents_blessing_group: (maritalStatus === "Single" && singleCategory === "Blessed Child" && blessedChildGeneration) ? (parentsBlessingGroup || null) : null,
        children_names: (maritalStatus === "Previously Married" || maritalStatus === "Blessed" || maritalStatus === "Widowed") ? (childrenNames.length > 0 ? childrenNames : null) : null,
        spouse_name: (maritalStatus === "Blessed" || maritalStatus === "Widowed" || maritalStatus === "Previously Married") ? (spouseName || null) : null,
        date_of_marriage: maritalStatus === "Previously Married" ? (dateOfMarriage || null) : null,
        blessing_group: maritalStatus === "Blessed" ? (blessingGroup || null) : null,
        date_of_blessing: maritalStatus === "Blessed" ? (dateOfBlessing || null) : null,
        ascension_date: maritalStatus === "Widowed" ? (ascensionDate || null) : null,
        seonghwa_date: maritalStatus === "Widowed" ? (seonghwaDate || null) : null,
        education_status: educationStatus || null,
        education_degree_status: educationDegreeStatus || null,
        education_degree: educationDegree || null,
        education_institution: educationInstitution || null,
        tithing_type: tithingType || null,
        phone_country_code: phoneCountryCode || null,
        avatar_url: finalAvatarUrl || null,
        family_photo_url: finalFamilyPhotoUrl || null,
        extra_fields: fields.map((f) => ({ title: f.title, value: f.value })),
      };
      return updateUserProfile(user.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      navigate("/dashboard");
    },
  });

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Please log in</p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-secondary/30 lg:block">
        <div className="flex h-full flex-col">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
              <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
              <span>FFWPU-SA</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/dashboard">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>

          <div className="space-y-1 px-3 pb-3">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/events">
                <CalendarDays className="mr-2 h-4 w-4" />
                Events
              </Link>
            </Button>
          </div>

          <div className="border-t p-3">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 animate-fade-in">
        {/* Mobile header */}
        <header className="border-b bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
              <span>FFWPU-SA</span>
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/events">
                  <CalendarDays className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="container max-w-4xl py-12">
          <div className="mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary mb-4">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Edit Your Profile
            </div>
          </div>
          <Card className="shadow-card border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
              <CardTitle className="text-primary">Edit Your Profile</CardTitle>
              <CardDescription>Update your profile information below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                className="space-y-6"
              >
                {/* Avatar upload section */}
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-primary/10">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-hero text-2xl font-semibold text-primary-foreground">
                        {(name || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar"
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 cursor-pointer shadow-lg transition-all"
                    >
                      <Camera className="h-5 w-5" />
                    </label>
                  </div>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setAvatarFile(f);
                      if (f) setAvatarUrl(URL.createObjectURL(f));
                    }}
                  />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max. 5MB)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (!avatarFile || !user) return;
                        try {
                          setUploading(true);
                          const fileExt = avatarFile.name.split(".").pop();
                          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                          const { error: uploadError } = await supabaseStorage
                            .from("avatars")
                            .upload(filePath, avatarFile);
                          if (uploadError) throw uploadError;
                          const { data } = supabaseStorage.from("avatars").getPublicUrl(filePath);
                          setAvatarUrl(data.publicUrl);
                          setAvatarFile(null);
                        } catch (err) {
                          console.error("Upload error", err);
                        } finally {
                          setUploading(false);
                        }
                      }}
                      disabled={!avatarFile || uploading}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAvatarUrl("");
                          setAvatarFile(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">{user.email}</p>
                    <Mail className="h-4 w-4 text-muted-foreground mx-auto mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-primary">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-primary">Family Name</label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="Enter your family name"
                      className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Current country of residence"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Province</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Province or state"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country of Birth</label>
                    <input
                      type="text"
                      value={countryOfBirth}
                      onChange={(e) => setCountryOfBirth(e.target.value)}
                      placeholder="Country where you were born"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-background w-32"
                      >
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+82">🇰🇷 +82</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+351">🇵🇹 +351</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+254">🇰🇪 +254</option>
                        <option value="+255">🇹🇿 +255</option>
                        <option value="+263">🇿🇼 +263</option>
                        <option value="+264">🇳🇦 +264</option>
                        <option value="+267">🇧🇼 +267</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number"
                        className="flex-1 px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category of Member</label>
                    <select
                      value={categoryOfMember}
                      onChange={(e) => setCategoryOfMember(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select category</option>
                      <option value="Full time member">Full time member</option>
                      <option value="Associate Member">Associate Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Marital Status</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => {
                        setMaritalStatus(e.target.value);
                        // Reset dependent fields when marital status changes
                        if (e.target.value !== "Single") {
                          setSingleCategory("");
                          setBlessedChildGeneration("");
                        }
                        if (e.target.value === "Previously Married" && childrenNames.length === 0) {
                          setChildrenNames([]);
                        } else if (e.target.value !== "Previously Married") {
                          setChildrenNames([]);
                        }
                        if (e.target.value !== "Blessed") {
                          setBlessingGroup("");
                          setDateOfBlessing("");
                        }
                        if (e.target.value !== "Widowed") {
                          setAscensionDate("");
                          setSeonghwaDate("");
                        }
                        if (e.target.value !== "Blessed" && e.target.value !== "Widowed") {
                          setSpouseName("");
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select status</option>
                      <option value="Single">Single</option>
                      <option value="Matched">Matched</option>
                      <option value="Previously Married">Previously Married</option>
                      <option value="Blessed">Blessed</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                {/* Conditional fields for Single status */}
                {maritalStatus === "Single" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Single Category</label>
                        <select
                          value={singleCategory}
                          onChange={(e) => {
                            setSingleCategory(e.target.value);
                            // Reset generation and parents blessing group when single category changes
                            if (e.target.value !== "Blessed Child") {
                              setBlessedChildGeneration("");
                              setParentsBlessingGroup("");
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        >
                          <option value="">Select category</option>
                          <option value="1st Generation">1st Generation</option>
                          <option value="Blessed Child">Blessed Child</option>
                          <option value="Jacobs Child">Jacobs Child</option>
                        </select>
                      </div>

                      {singleCategory === "Blessed Child" && blessedChildGeneration && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Parents' Blessing Group</label>
                          <input
                            type="text"
                            value={parentsBlessingGroup}
                            onChange={(e) => setParentsBlessingGroup(e.target.value)}
                            placeholder="Enter parents' blessing group"
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                        </div>
                      )}
                    </div>

                    {singleCategory === "Blessed Child" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Generation</label>
                        <select
                          value={blessedChildGeneration}
                          onChange={(e) => {
                            setBlessedChildGeneration(e.target.value);
                            if (!e.target.value) {
                              setParentsBlessingGroup("");
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        >
                          <option value="">Select generation</option>
                          <option value="2nd Generation">2nd Generation</option>
                          <option value="3rd Generation">3rd Generation</option>
                          <option value="4th Generation">4th Generation</option>
                          <option value="5th Generation">5th Generation</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional fields for Previously Married status */}
                {maritalStatus === "Previously Married" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Spouse Name</label>
                        <input
                          type="text"
                          value={spouseName}
                          onChange={(e) => setSpouseName(e.target.value)}
                          placeholder="Enter spouse name"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Date of Marriage</label>
                        <input
                          type="date"
                          value={dateOfMarriage}
                          onChange={(e) => setDateOfMarriage(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Children's Names</label>
                      <div className="space-y-2">
                        {childrenNames.map((name, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...childrenNames];
                                newNames[idx] = e.target.value;
                                setChildrenNames(newNames);
                              }}
                              placeholder={`Child ${idx + 1} name`}
                              className="flex-1 px-3 py-2 border rounded-md bg-background"
                            />
                            <button
                              type="button"
                              onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== idx))}
                              className="px-3 py-2 border rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setChildrenNames([...childrenNames, ""])}
                          className="px-3 py-2 border rounded-md bg-background hover:bg-secondary text-sm"
                        >
                          + Add Child
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields for Blessed status */}
                {maritalStatus === "Blessed" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Spouse Name</label>
                        <input
                          type="text"
                          value={spouseName}
                          onChange={(e) => setSpouseName(e.target.value)}
                          placeholder="Enter spouse name"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Blessing Group (include 2nd/3rd Gen if applicable)</label>
                        <input
                          type="text"
                          value={blessingGroup}
                          onChange={(e) => setBlessingGroup(e.target.value)}
                          placeholder="Enter blessing group"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date of Blessing</label>
                        <input
                          type="date"
                          value={dateOfBlessing}
                          onChange={(e) => setDateOfBlessing(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        {/* spacer for layout parity */}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Children's Names</label>
                      <div className="space-y-2">
                        {childrenNames.map((name, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...childrenNames];
                                newNames[idx] = e.target.value;
                                setChildrenNames(newNames);
                              }}
                              placeholder={`Child ${idx + 1} name`}
                              className="flex-1 px-3 py-2 border rounded-md bg-background"
                            />
                            <button
                              type="button"
                              onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== idx))}
                              className="px-3 py-2 border rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setChildrenNames([...childrenNames, ""])}
                          className="px-3 py-2 border rounded-md bg-background hover:bg-secondary text-sm"
                        >
                          + Add Child
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields for Widowed status */}
                {maritalStatus === "Widowed" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Spouse Name</label>
                      <input
                        type="text"
                        value={spouseName}
                        onChange={(e) => setSpouseName(e.target.value)}
                        placeholder="Enter spouse name"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Ascension Date</label>
                        <input
                          type="date"
                          value={ascensionDate}
                          onChange={(e) => setAscensionDate(e.target.value)}
                          placeholder="Enter ascension date"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Seonghwa</label>
                        <input
                          type="date"
                          value={seonghwaDate}
                          onChange={(e) => setSeonghwaDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Children's Names</label>
                      <div className="space-y-2">
                        {childrenNames.map((name, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                const newNames = [...childrenNames];
                                newNames[idx] = e.target.value;
                                setChildrenNames(newNames);
                              }}
                              placeholder={`Child ${idx + 1} name`}
                              className="flex-1 px-3 py-2 border rounded-md bg-background"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== idx))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChildrenNames([...childrenNames, ""])}
                        >
                          Add child
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Education Status</label>
                    <select
                      value={educationStatus}
                      onChange={(e) => {
                        setEducationStatus(e.target.value);
                        if (!["Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctoral Degree"].includes(e.target.value)) {
                          setEducationDegreeStatus("");
                          setEducationDegree("");
                          setEducationInstitution("");
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select education level</option>
                      <option value="High School">High School</option>
                      <option value="Some College">Some College</option>
                      <option value="Associate Degree">Associate Degree</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctoral Degree">Doctoral Degree</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tithing</label>
                    <select
                      value={tithing}
                      onChange={(e) => {
                        setTithing(e.target.value);
                        if (!["Regular", "Occasional"].includes(e.target.value)) {
                          setTithingType("");
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select tithing status</option>
                      <option value="Regular">Regular</option>
                      <option value="Occasional">Occasional</option>
                      <option value="Not Currently">Not Currently</option>
                    </select>
                  </div>
                </div>

                {["Regular", "Occasional"].includes(tithing) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={tithingType}
                        onChange={(e) => setTithingType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="">Select type</option>
                        <option value="Financial">Financial</option>
                        <option value="Time">Time</option>
                        <option value="Holy Day Donation">Holy Day Donation</option>
                      </select>
                    </div>
                  </div>
                )}

                {["Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctoral Degree"].includes(educationStatus) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                          value={educationDegreeStatus}
                          onChange={(e) => {
                            setEducationDegreeStatus(e.target.value);
                            if (e.target.value === "Taking a Break") {
                              setEducationDegree("");
                              setEducationInstitution("");
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        >
                          <option value="">Select status</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Currently Attending">Currently Attending</option>
                          <option value="Taking a Break">Taking a Break</option>
                        </select>
                      </div>
                    </div>

                    {(educationDegreeStatus === "Graduated" || educationDegreeStatus === "Currently Attending") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Degree</label>
                          <input
                            type="text"
                            value={educationDegree}
                            onChange={(e) => setEducationDegree(e.target.value)}
                            placeholder="e.g., Bachelor of Science"
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Institution</label>
                          <input
                            type="text"
                            value={educationInstitution}
                            onChange={(e) => setEducationInstitution(e.target.value)}
                            placeholder="e.g., University Name"
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setBio(e.target.value);
                      }
                    }}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border rounded-md bg-background h-24 resize-y min-h-[6rem] max-h-[60vh]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
                </div>

                <div id="additional-information-section">
                  <label className="block text-sm font-medium">Family Photo</label>
                  <p className="text-xs text-muted-foreground">Optional: upload a family photo!</p>
                  {familyPhotoUrl && (
                    <div className="rounded-md border border-primary/10 p-3 bg-background">
                      <div className="w-full flex justify-center">
                        <img
                          src={familyPhotoUrl}
                          alt="Family"
                          className="max-h-96 w-full h-auto object-contain rounded-md"
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFamilyPhotoUrl("");
                            setFamilyPhotoFile(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      id="familyPhotoEdit"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFamilyPhotoFile(f);
                        setFamilyPhotoUrl(f ? URL.createObjectURL(f) : "");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("familyPhotoEdit")?.click()}
                      disabled={uploadingFamilyPhoto}
                    >
                      {familyPhotoUrl ? "Change photo" : "Choose photo"}
                    </Button>
                    {familyPhotoUrl && <span className="text-xs text-muted-foreground">Ready to upload on save</span>}
                  </div>
                </div>

                <div id="additional-information-section">
                  <label className="block text-sm font-medium mb-2">Custom Information</label>
                  <p className="text-xs text-muted-foreground mb-2">Create/edit your custom title/description fields.</p>
                  <div className="space-y-3">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <input
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            placeholder="Title"
                            value={f.title}
                            onChange={(e) => {
                              const next = [...fields];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setFields(next);
                            }}
                          />
                          <textarea
                            className="w-full px-3 py-2 border rounded-md bg-background h-24 resize-y min-h-[6rem] max-h-[60vh]"
                            placeholder="Description"
                            value={f.value}
                            onChange={(e) => {
                              const next = [...fields];
                              next[idx] = { ...next[idx], value: e.target.value };
                              setFields(next);
                            }}
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <Button type="button" variant="ghost" className="mt-1" onClick={() => setFields(fields.filter((x) => x.id !== f.id))}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button type="button" onClick={() => setFields((s) => [...s, { id: String(Date.now()) + Math.random(), title: "", value: "" }])}>
                      Add field
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-card">
                    {mutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>

                {mutation.isError && (
                  <div className="text-sm text-destructive">
                    <p>Error saving profile. Please try again.</p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">{(mutation.error as any)?.message || JSON.stringify(mutation.error)}</pre>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfileEdit;
