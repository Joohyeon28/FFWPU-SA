import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseStorage } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { fetchUserProfile, updateUserProfile } from "@/lib/profile";
import { Mail, Camera, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminEditUser = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => (userId ? fetchUserProfile(userId) : null),
    enabled: !!userId,
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
  const [fields, setFields] = useState<Array<{ id: string; title: string; value: string }>>([]);
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState("");
  const [familyPhotoFile, setFamilyPhotoFile] = useState<File | null>(null);
  const [uploadingFamilyPhoto, setUploadingFamilyPhoto] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!currentUser || !isAdmin) {
      navigate("/");
      return;
    }
  }, [currentUser, isAdmin, authLoading, adminLoading, navigate]);

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

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user ID");

      let finalAvatarUrl = avatarUrl || undefined;
      if (avatarFile && avatarUrl.startsWith("blob:")) {
        const fileExt = avatarFile.name.split(".")?.pop() || "jpg";
        const storagePath = `${userId}/${Date.now()}.${fileExt}`;
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
        const storagePath = `${userId}/${Date.now()}.${fileExt}`;
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
        children_names: (maritalStatus === "Previously Married" || maritalStatus === "Blessed") ? (childrenNames.length > 0 ? childrenNames : null) : null,
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
      return updateUserProfile(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
      navigate("/admin/users");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    },
  });

  if (authLoading || adminLoading || profileLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }
              {/* Family Photo upload section */}
              <div id="additional-information-section">
                <label className="block text-sm font-medium">Family Photo</label>
                <p className="text-xs text-muted-foreground">Optional: upload a family photo!</p>
                {familyPhotoUrl && (
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src={familyPhotoUrl}
                      alt="Family Photo"
                      className="object-contain max-h-96 rounded-md border border-primary/10 bg-background shadow-md"
                      style={{ maxWidth: '100%' }}
                    />
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
                      if (f) setFamilyPhotoUrl(URL.createObjectURL(f));
                    }}
                  />
                  <label htmlFor="familyPhotoEdit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-all">
                    Select Family Photo
                  </label>
                  {familyPhotoFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!familyPhotoFile || !userId) return;
                        try {
                          setUploadingFamilyPhoto(true);
                          const fileExt = familyPhotoFile.name.split(".")?.pop() || "jpg";
                          const storagePath = `${userId}/${Date.now()}.${fileExt}`;
                          const { error } = await supabaseStorage.from("family-photos").upload(storagePath, familyPhotoFile);
                          if (error) throw error;
                          const { data } = supabaseStorage.from("family-photos").getPublicUrl(storagePath);
                          setFamilyPhotoUrl(data.publicUrl);
                          setFamilyPhotoFile(null);
                          toast({ title: "Success", description: "Family photo uploaded." });
                        } catch (err) {
                          console.error("Family photo upload error:", err);
                          toast({ title: "Error", description: "Failed to upload family photo.", variant: "destructive" });
                        } finally {
                          setUploadingFamilyPhoto(false);
                        }
                      }}
                      disabled={uploadingFamilyPhoto}
                    >
                      {uploadingFamilyPhoto ? "Uploading..." : "Upload"}
                    </Button>
                  )}
                  {familyPhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFamilyPhotoUrl("");
                        setFamilyPhotoFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {uploadingFamilyPhoto && (
                  <p className="text-xs text-muted-foreground mt-2">Uploading family photo...</p>
                )}
              </div>

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit User Profile</h1>
              <p className="text-muted-foreground">Editing profile for {profile.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-12">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Update user profile information below</CardDescription>
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
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
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
                      if (!avatarFile || !userId) return;
                      try {
                        setUploading(true);
                        const fileExt = avatarFile.name.split(".")?.pop() || "jpg";
                        const storagePath = `${userId}/${Date.now()}.${fileExt}`;
                        const { error } = await supabaseStorage.from("avatars").upload(storagePath, avatarFile);
                        if (error) throw error;
                        const { data } = supabaseStorage.from("avatars").getPublicUrl(storagePath);
                        setAvatarUrl(data.publicUrl);
                        setAvatarFile(null);
                      } catch (err) {
                        console.error("Upload error:", err);
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
                  <p className="text-sm font-medium text-muted-foreground">{profile.email}</p>
                  <Mail className="h-4 w-4 text-muted-foreground mx-auto mt-1" />
                </div>
              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Family Name</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Enter family name"
                    className="w-full px-3 py-2 border rounded-md bg-background"
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
                    placeholder="Country where born"
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
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+254">🇰🇪 +254</option>
                      <option value="+263">🇿🇼 +263</option>
                      <option value="+267">🇧🇼 +267</option>
                      <option value="+256">🇺🇬 +256</option>
                      <option value="+255">🇹🇿 +255</option>
                      <option value="+260">🇿🇲 +260</option>
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
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
                      if (e.target.value !== "Single") {
                        setSingleCategory("");
                        setBlessedChildGeneration("");
                        setParentsBlessingGroup("");
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
                          if (e.target.value !== "Blessed Child") {
                            setBlessedChildGeneration("");
                            setParentsBlessingGroup("");
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="">Select category</option>
                        <option value="Never Married">Never Married</option>
                        <option value="Matched">Matched</option>
                        <option value="Blessed Child">Blessed Child</option>
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
                        <option value="2nd">2nd Generation</option>
                        <option value="3rd">3rd Generation</option>
                        <option value="4th">4th Generation</option>
                        <option value="5th+">5th+ Generation</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional fields for Previously Married status */}
              {maritalStatus === "Previously Married" && (
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Marriage</label>
                    <input
                      type="date"
                      value={dateOfMarriage}
                      onChange={(e) => setDateOfMarriage(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Children's Names</label>
                    <div className="space-y-2">
                      {childrenNames.map((child, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={child}
                            onChange={(e) => {
                              const updated = [...childrenNames];
                              updated[idx] = e.target.value;
                              setChildrenNames(updated);
                            }}
                            placeholder={`Child ${idx + 1} name`}
                            className="flex-1 px-3 py-2 border rounded-md bg-background"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setChildrenNames([...childrenNames, ""])}
                      >
                        + Add Child
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional fields for Blessed status */}
              {maritalStatus === "Blessed" && (
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
                    <label className="block text-sm font-medium mb-2">Children's Names</label>
                    <div className="space-y-2">
                      {childrenNames.map((child, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={child}
                            onChange={(e) => {
                              const updated = [...childrenNames];
                              updated[idx] = e.target.value;
                              setChildrenNames(updated);
                            }}
                            placeholder={`Child ${idx + 1} name`}
                            className="flex-1 px-3 py-2 border rounded-md bg-background"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setChildrenNames([...childrenNames, ""])}
                      >
                        + Add Child
                      </Button>
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Ascension Date</label>
                    <input
                      type="text"
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
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                </div>
              )}

              {["Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctoral Degree"].includes(educationStatus) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Degree Status</label>
                      <select
                        value={educationDegreeStatus}
                        onChange={(e) => setEducationDegreeStatus(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="">Select status</option>
                        <option value="Currently Attending">Currently Attending</option>
                        <option value="Graduated">Graduated</option>
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
                          placeholder="e.g., Computer Science"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Institution</label>
                        <input
                          type="text"
                          value={educationInstitution}
                          onChange={(e) => setEducationInstitution(e.target.value)}
                          placeholder="e.g., University of Cape Town"
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
                  placeholder="Tell us about this user..."
                  className="w-full px-3 py-2 border rounded-md bg-background h-24 resize-y min-h-[6rem] max-h-[60vh]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
              </div>

              {/* Family Photo upload section - now above custom fields */}
              <div id="family-photo-upload-section" className="flex flex-col items-center gap-4 mt-8 mb-4">
                <label className="block text-sm font-medium">Family Photo</label>
                <p className="text-xs text-muted-foreground">Optional: upload a family photo!</p>
                {familyPhotoUrl && (
                  <div className="flex flex-col items-center mb-2">
                    <img
                      src={familyPhotoUrl}
                      alt="Family Photo"
                      className="object-contain max-h-96 rounded-md border border-primary/10 bg-background shadow-md"
                      style={{ maxWidth: '100%' }}
                    />
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
                      if (f) setFamilyPhotoUrl(URL.createObjectURL(f));
                    }}
                  />
                  <label htmlFor="familyPhotoEdit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-all">
                    Select Family Photo
                  </label>
                  {familyPhotoFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!familyPhotoFile || !userId) return;
                        try {
                          setUploadingFamilyPhoto(true);
                          const fileExt = familyPhotoFile.name.split(".")?.pop() || "jpg";
                          const storagePath = `${userId}/${Date.now()}.${fileExt}`;
                          const { error } = await supabaseStorage.from("family-photos").upload(storagePath, familyPhotoFile);
                          if (error) throw error;
                          const { data } = supabaseStorage.from("family-photos").getPublicUrl(storagePath);
                          setFamilyPhotoUrl(data.publicUrl);
                          setFamilyPhotoFile(null);
                          toast({ title: "Success", description: "Family photo uploaded." });
                        } catch (err) {
                          console.error("Family photo upload error:", err);
                          toast({ title: "Error", description: "Failed to upload family photo.", variant: "destructive" });
                        } finally {
                          setUploadingFamilyPhoto(false);
                        }
                      }}
                      disabled={uploadingFamilyPhoto}
                    >
                      {uploadingFamilyPhoto ? "Uploading..." : "Upload"}
                    </Button>
                  )}
                  {familyPhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFamilyPhotoUrl("");
                        setFamilyPhotoFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {uploadingFamilyPhoto && (
                  <p className="text-xs text-muted-foreground mt-2">Uploading family photo...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Custom Information</label>
                <p className="text-xs text-muted-foreground mb-2">Create/edit custom title/description fields.</p>
                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div key={f.id} className="space-y-2 p-4 border rounded-md bg-secondary/10">
                      <div className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={f.title}
                          onChange={(e) => {
                            const updated = [...fields];
                            updated[idx].title = e.target.value;
                            setFields(updated);
                          }}
                          placeholder="Field title"
                          className="flex-1 px-3 py-2 border rounded-md bg-background"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                      <textarea
                        value={f.value}
                        onChange={(e) => {
                          const updated = [...fields];
                          updated[idx].value = e.target.value;
                          setFields(updated);
                        }}
                        placeholder="Field description"
                        className="w-full px-3 py-2 border rounded-md bg-background h-24 resize-y"
                      />
                    </div>
                  ))}

                  <Button type="button" onClick={() => setFields((s) => [...s, { id: String(Date.now()) + Math.random(), title: "", value: "" }])}>
                    Add field
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={mutation.isPending} className="flex-1">
                  {mutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
                  Cancel
                </Button>
              </div>

              {mutation.isError && (
                <div className="text-sm text-destructive">
                  <p>Error saving profile. Please try again.</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(mutation.error, null, 2)}</pre>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminEditUser;
