import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 shadow-card md:p-20 text-white border border-primary/20">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/20 blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Limited Time Offer</span>
            </div>

            <h2 className="mb-4 text-4xl font-bold md:text-5xl text-white leading-tight">
              Ready to connect with your community?
            </h2>
            <p className="mb-10 text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Create your account today and start building meaningful connections with thousands of community members.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
                asChild
              >
                <Link to="/register" className="flex items-center gap-2">
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold px-8"
                asChild
              >
                <Link to="/login">Already a member? Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
