import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-32 md:py-40 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4" />
              Welcome to the future of membership management
            </div>
          </div>

          <h1 className="mb-8 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-slide-up text-center leading-tight" style={{ animationDelay: "0.1s" }}>
            Connect, Share &<br/>
            <span className="text-white/80">Build Community</span>
          </h1>

          <p className="mb-10 text-xl text-white/90 md:text-2xl animate-slide-up text-center max-w-3xl mx-auto leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Create meaningful connections, manage your profile, and be part of something bigger. Join thousands of members building their community presence.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8" asChild>
              <Link to="/register" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold px-8" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-white/70 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            No credit card required • Free forever for individuals
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default HeroSection;
