import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Target, Sparkles, MessageSquare, Calendar, Trophy, Mail } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section with Gradient Overlay */}
      <Header />
      
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative max-w-6xl py-24 px-4 sm:px-6 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Community Platform</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
              About FFWPU-SA
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              A community-driven platform designed to strengthen connections and keep our members informed and engaged.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </div>

      <main className="container max-w-6xl py-16 px-4 sm:px-6">
        {/* Mission Statement - Featured Card */}
        <Card className="mb-16 border-2 border-primary/20 shadow-card bg-gradient-to-br from-white to-primary/5 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
              The <strong className="text-primary">FFWPU-SA</strong> was created to provide a central, 
              reliable platform where community members can connect, stay informed, and 
              easily access verified member information. Our mission is to strengthen 
              communication, build relationships, and maintain transparency within our 
              growing community.
            </p>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Who This Is For */}
          <Card className="shadow-card hover:shadow-card transition-all duration-300 border-l-4 border-l-primary animate-slide-up" style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Who This Platform Is For</CardTitle>
              <CardDescription className="text-base">Designed for everyone in our community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                This platform is designed for all authenticated members of our community. Whether
                you're new or long-standing, FFWPU-SA ensures that everyone remains
                visible, reachable, and able to contribute meaningfully.
              </p>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="shadow-card hover:shadow-card transition-all duration-300 border-l-4 border-l-primary animate-slide-up" style={{animationDelay: '0.2s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Privacy & Security</CardTitle>
              <CardDescription className="text-base">Your data is protected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                Your data and privacy are treated with the highest importance. Only authenticated 
                members have access to the directory, and all sensitive information is protected 
                using secure, industry-standard practices.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">What You Can Do Here</h2>
            <p className="text-lg text-muted-foreground">Features available to our community</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Browse Directory", desc: "Search and explore our member directory" },
              { icon: Users, title: "View Profiles", desc: "Access detailed member profiles" },
              { icon: Target, title: "Update Profile", desc: "Keep your information current" },
              { icon: MessageSquare, title: "Direct Communication", desc: "Connect with other members" },
              { icon: Users, title: "Stay Connected", desc: "Join our community network" },
              { icon: Sparkles, title: "Contribute", desc: "Add meaningful value" },
            ].map((feature, idx) => (
              <Card 
                key={idx}
                className="shadow-card hover:shadow-card transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-primary animate-slide-up bg-white"
                style={{animationDelay: `${0.1 * idx}s`}}
              >
                <CardContent className="pt-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why This Matters - Full Width Accent */}
        <Card className="mb-16 bg-gradient-to-r from-primary to-primary/80 text-white shadow-card animate-slide-up border-0">
          <CardContent className="py-12 px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Why This Matters</h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-4xl mx-auto">
              As our community expands, staying connected becomes more challenging. This platform
              ensures every member has a digital presence, helping enhance unity by enabling 
              meaningful interactions and easy access to member information.
            </p>
          </CardContent>
        </Card>

        {/* Story and Future Goals Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-card hover:shadow-card transition-all duration-300 animate-slide-up bg-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Our Story
              </CardTitle>
              <CardDescription className="text-base">How it all began</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                FFWPU-SA began as a community-driven project to modernize how we 
                manage membership records. What started as a simple idea has evolved into a complete 
                digital tool designed to support the needs of our community.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card transition-all duration-300 animate-slide-up bg-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                Future Goals
              </CardTitle>
              <CardDescription className="text-base">What's coming next</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: MessageSquare, text: "Advanced messaging features" },
                  { icon: Calendar, text: "Event and announcement alerts" },
                  { icon: Users, text: "Group pages and private communities" },
                  { icon: Trophy, text: "Profile achievements and badges" },
                ].map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                      <goal.icon className="w-4 h-4 text-white" />
                    </div>
                    <span>{goal.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact CTA */}
        <Card className="shadow-card bg-gradient-to-br from-foreground to-foreground/90 text-white border-0 animate-slide-up">
          <CardContent className="py-12 px-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
              Have questions or suggestions? We'd love to hear from you.
            </p>
            <a 
              href="mailto:joohyeonstemmer28@gmail.com"
              className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-card hover:shadow-card"
            >
              <Mail className="w-5 h-5" />
              joohyeonstemmer28@gmail.com
            </a>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default About;
