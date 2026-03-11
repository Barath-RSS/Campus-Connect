import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, X, Search } from 'lucide-react';
import { CAMPUS_LANDMARKS } from '@/constants/campusLocations';
import { Input } from '@/components/ui/input';

interface LandmarkComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function LandmarkCombobox({ value, onChange }: LandmarkComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = CAMPUS_LANDMARKS.filter((lm) =>
    lm.toLowerCase().includes((search || value).toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (lm: string) => {
    onChange(lm);
    setSearch('');
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange(val); // Allow free typing
    if (!open) setOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10 group-focus-within:text-primary transition-colors" />
        <Input
          ref={inputRef}
          value={search || value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Type or select campus location..."
          className="pl-10 pr-16 h-11 rounded-xl border-2 focus:border-primary transition-all duration-300 bg-card/80 backdrop-blur-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            {/* Search hint */}
            <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="w-3 h-3" />
              <span>Type to search or select from list</span>
            </div>

            <div className="max-h-52 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">No matching landmark</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Your custom location will be used</p>
                </div>
              ) : (
                filtered.map((lm, i) => (
                  <motion.button
                    key={lm}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    onClick={() => handleSelect(lm)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5 hover:bg-primary/8 ${
                      value === lm ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${value === lm ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    <span>{lm}</span>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
