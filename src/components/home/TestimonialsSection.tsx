import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Community Manager",
    avatar: "SC",
    content: "FFWPU-SA transformed how we manage our members. The profile system is incredibly intuitive and our engagement has doubled.",
  },
  {
    name: "Marcus Johnson",
    role: "Tech Founder",
    avatar: "MJ",
    content: "Finally, a platform that puts user privacy first. The security features give our members peace of mind.",
  },
  {
    name: "Emily Rodriguez",
    role: "Content Creator",
    avatar: "ER",
    content: "I love how easy it is to customize my profile. The custom fields feature lets me showcase exactly what matters to my audience.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Loved by communities worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our members have to say about their experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name} 
              className="hover:shadow-elevated transition-all duration-300"
            >
              <CardContent className="p-6">
                <Quote className="mb-4 h-8 w-8 text-primary/20" />
                <p className="mb-6 text-muted-foreground">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
