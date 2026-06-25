import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { getSignedIssueImageUrl } from '@/lib/storage';

interface SignedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallbackClassName?: string;
}

/**
 * Renders an <img> after resolving a short-lived signed URL for the private
 * `issue-images` bucket. Accepts either legacy stored public URLs or bare
 * storage paths.
 */
export function SignedImage({ src, alt = '', className, fallbackClassName, ...rest }: SignedImageProps) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    setFailed(false);
    if (!src) return;
    getSignedIssueImageUrl(src).then((url) => {
      if (cancelled) return;
      if (url) setResolved(url);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={
          fallbackClassName ||
          `${className ?? ''} flex items-center justify-center bg-muted text-xs text-muted-foreground`
        }
      >
        Image unavailable
      </div>
    );
  }

  if (!resolved) {
    return (
      <div
        className={`${className ?? ''} bg-muted/40 animate-pulse`}
        aria-label="Loading image"
      />
    );
  }

  return <img src={resolved} alt={alt} className={className} {...rest} />;
}
