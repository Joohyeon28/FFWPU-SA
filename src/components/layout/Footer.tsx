import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-gradient-to-b from-foreground/5 to-foreground/10 mt-24">
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity">
              <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-8 w-8" />
              <span className="font-bold">FFWPU-SA</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connecting our community through a modern, reliable platform for members to engage and stay informed.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/messages" className="text-sm text-muted-foreground hover:text-primary transition-colors">Messages</Link></li>
              <li><Link to="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">Events</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/profile/edit" className="text-sm text-muted-foreground hover:text-primary transition-colors">Edit Profile</Link></li>
              <li><Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:joohyeonstemmer28@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Get in Touch
                </a>
              </li>
              <li className="text-sm text-muted-foreground">joohyeonstemmer28@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            © 2025 FFWPU-SA. Created by Joohyeon Stemmer with <Heart className="h-4 w-4 text-primary" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
