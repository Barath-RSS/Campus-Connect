import { MapPin, ExternalLink, Navigation, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationLinkProps {
  lat: number;
  lng: number;
  variant?: 'inline' | 'button' | 'card';
  className?: string;
}

/**
 * Multiple map providers to ensure links work on restricted networks.
 * Tries: geo: URI (mobile native), Google Maps (multiple domains), OpenStreetMap
 */
const getMapUrls = (lat: number, lng: number) => ({
  // geo: URI opens native maps app on mobile (Android/iOS)
  geo: `geo:${lat},${lng}?q=${lat},${lng}`,
  // Google Maps - official search API URL
  google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  // Google Maps alternative domain
  googleAlt: `https://maps.google.com/?q=${lat},${lng}`,
  // Google Maps via maps.app (newer mobile-friendly domain)
  googleApp: `https://maps.app.goo.gl/?link=https://www.google.com/maps/search/?api=1%26query=${lat},${lng}`,
  // OpenStreetMap - always works, no blocking
  osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
});

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const handleMapOpen = (lat: number, lng: number, provider: 'google' | 'osm' | 'auto') => {
  const urls = getMapUrls(lat, lng);
  
  if (provider === 'auto' || provider === 'google') {
    if (isMobile()) {
      // On mobile, try geo: URI first (opens native maps app)
      window.location.href = urls.geo;
      // Fallback after short delay if geo: didn't work
      setTimeout(() => {
        window.open(urls.google, '_blank', 'noopener,noreferrer');
      }, 500);
      return;
    }
    window.open(urls.google, '_blank', 'noopener,noreferrer');
  } else {
    window.open(urls.osm, '_blank', 'noopener,noreferrer');
  }
};

export function LocationLink({ lat, lng, variant = 'inline', className }: LocationLinkProps) {
  const urls = getMapUrls(lat, lng);

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <button
          onClick={() => handleMapOpen(lat, lng, 'google')}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <MapPin className="w-3 h-3" />
          Google Maps
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
        <span className="text-xs text-muted-foreground">|</span>
        <a
          href={urls.osm}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary/70 inline-flex items-center gap-1 hover:underline font-medium hover:text-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Globe className="w-2.5 h-2.5" />
          OpenStreetMap
        </a>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <button
          onClick={() => handleMapOpen(lat, lng, 'google')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all duration-300 border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <MapPin className="w-4 h-4" />
          Google Maps
          <ExternalLink className="w-3 h-3" />
        </button>
        <a
          href={urls.osm}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all duration-300 border border-border hover:border-primary/20 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Globe className="w-4 h-4" />
          OpenStreetMap
        </a>
      </div>
    );
  }

  // card variant
  return (
    <div className={cn(
      "rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 space-y-3 animate-fade-in",
      className
    )}>
      <div className="flex items-center gap-2 text-primary">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">GPS Location</p>
          <p className="text-[10px] text-muted-foreground font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleMapOpen(lat, lng, 'google')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <MapPin className="w-3 h-3" />
          Google Maps
        </button>
        <a
          href={urls.osm}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-all border border-border hover:scale-[1.02] active:scale-[0.98]"
        >
          <Globe className="w-3 h-3" />
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}

// Export URL helper for use in PDFs and other non-React contexts
export const getGoogleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const getOpenStreetMapUrl = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
