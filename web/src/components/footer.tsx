import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="hidden lg:block shrink-0 border-t border-border/10 bg-background/50 backdrop-blur-md px-6 py-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Cuan</span>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
