import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, Globe, Lock, Palette, MessageCircle, Calendar } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Member Profiles",
    description: "Create and customize your unique profile to showcase who you are in the community.",
  },
  {
    icon: MessageCircle,
    title: "Messaging System",
    description: "Connect with other members through direct messages and group conversations.",
  },
  {
    icon: Calendar,
    title: "Event Planner",
    description: "Organize and manage community events, meetings, and gatherings with ease.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Enterprise-grade security with email verification and encrypted data storage.",
  },
  {
    icon: Globe,
    title: "Accessible Anywhere",
    description: "Access your community from any device, anywhere in the world.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Full control over your data with granular privacy settings.",
  },
  {
    icon: Palette,
    title: "Customizable Fields",
    description: "Add custom fields to make your profile truly unique and informative.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl text-foreground">
            Everything you need to connect
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Powerful features designed to help you build and manage your community presence effortlessly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group hover:shadow-card hover:border-primary/30 transition-all duration-300 border-t-4 border-t-primary/20 hover:border-t-primary bg-white animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white transition-all group-hover:shadow-lg group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
