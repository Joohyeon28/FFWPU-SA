import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-hero">
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="text-center text-primary-foreground animate-scale-in">
            <h1 className="text-4xl font-bold mb-2">Page not found</h1>
            <p className="text-primary-foreground/80 mb-6">The page you’re looking for doesn’t exist.</p>
            <Button asChild variant="secondary" className="shadow-soft">
              <Link to="/">Go home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
