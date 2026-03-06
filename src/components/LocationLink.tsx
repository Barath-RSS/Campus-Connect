import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationLinkProps {
  lat: number;
  lng: number;
  variant?: 'inline' | 'button' | 'card';
  className?: string;
}

/**
 * Uses multiple map providers to ensure links work even on restricted networks.
 * Primary: Google Maps (official URL API)
 * Fallback: OpenStreetMap
 */
const getMapUrls = (lat: number, lng: number) => ({
  google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
});

export function LocationLink({ lat, lng, variant = 'inline', className }: LocationLinkProps) {
  const urls = getMapUrls(lat, lng);

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <motion.a
          href={urls.google}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-medium"
        >
          <MapPin className="w-3 h-3" />
          Google Maps
          <ExternalLink className="w-2.5 h-2.5" />
        </motion.a>
        <span className="text-xs text-muted-foreground">|</span>
        <motion.a
          href={urls.osm}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="text-xs text-primary/70 inline-flex items-center gap-1 hover:underline font-medium hover:text-primary"
        >
          <Navigation className="w-2.5 h-2.5" />
          OpenStreetMap
        </motion.a>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleOpen(urls.google)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all duration-300 border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md"
        >
          <MapPin className="w-4 h-4" />
          Google Maps
          <ExternalLink className="w-3 h-3" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleOpen(urls.osm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all duration-300 border border-border hover:border-primary/20 shadow-sm hover:shadow-md"
        >
          <Navigation className="w-4 h-4" />
          OpenStreetMap
        </motion.button>
      </div>
    );
  }

  // card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 space-y-3",
        className
      )}
    >
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
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleOpen(urls.google)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <MapPin className="w-3 h-3" />
          Google Maps
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleOpen(urls.osm)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-all border border-border"
        >
          <Navigation className="w-3 h-3" />
          OpenStreetMap
        </motion.button>
      </div>
    </motion.div>
  );
}

// Export URL helper for use in PDFs and other non-React contexts
export const getGoogleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const getOpenStreetMapUrl = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
