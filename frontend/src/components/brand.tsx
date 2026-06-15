import Link from 'next/link';

/**
 * Apex brand mark — the four-pointed "twinkle" star with the signature face.
 * Flat fills (no gradient ids) so it can be rendered any number of times on a
 * page without id collisions, and stays crisp from favicon size up to the hero.
 */
export function StarLogo({
  size = 30,
  className = '',
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M50 6 Q61.3 38.7 94 50 Q61.3 61.3 50 94 Q38.7 61.3 6 50 Q38.7 38.7 50 6 Z"
        fill="#FFD63B"
        stroke="#FF9D1C"
        strokeWidth={5.5}
        strokeLinejoin="round"
      />
      <path d="M33 43 Q40 39.5 47 42" fill="none" stroke="#3A2614" strokeWidth={3.2} strokeLinecap="round" />
      <path d="M53 42 Q60 39.5 67 43" fill="none" stroke="#3A2614" strokeWidth={3.2} strokeLinecap="round" />
      <path
        d="M35.5 50.2 C38 46.4 46 46.4 48.5 49.8 C46 52.8 38 53 35.5 50.2 Z"
        fill="#FBF1CE"
        stroke="#3A2614"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <path
        d="M51.5 49.8 C54 46.4 62 46.4 64.5 50.2 C62 53 54 52.8 51.5 49.8 Z"
        fill="#FBF1CE"
        stroke="#3A2614"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <circle cx="42.6" cy="50.5" r="3" fill="#3A2614" />
      <circle cx="57.8" cy="50.3" r="3" fill="#3A2614" />
      <circle cx="43.5" cy="49.6" r="0.85" fill="#FFF8E1" />
      <circle cx="58.7" cy="49.4" r="0.85" fill="#FFF8E1" />
      <path d="M40 61.6 Q50 65.4 60 60.9" fill="none" stroke="#3A2614" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}

type Size = 'sm' | 'md' | 'lg';
const PX: Record<Size, number> = { sm: 26, md: 30, lg: 40 };
const TEXT: Record<Size, string> = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

/**
 * Logo lockup: the star mark + the Russian "Апекс" wordmark.
 * Pass `href` to make it a link, `gradient` to render the gold gradient wordmark.
 */
export function Brand({
  href,
  size = 'md',
  className = '',
  gradient = false,
  glow = false,
  wordmarkClassName = '',
}: {
  href?: string;
  size?: Size;
  className?: string;
  gradient?: boolean;
  glow?: boolean;
  wordmarkClassName?: string;
}) {
  const inner = (
    <>
      <StarLogo size={PX[size]} className={`flex-shrink-0${glow ? ' apex-glow-sm' : ''}`} />
      <span
        className={`font-display font-bold tracking-tight leading-none ${TEXT[size]} ${
          gradient ? 'apex-text-gold' : 'text-[#F0EDE8]'
        } ${wordmarkClassName}`}
      >
        Апекс
      </span>
    </>
  );
  const cls = `inline-flex items-center gap-2 ${className}`;
  return href ? (
    <Link href={href} className={cls} aria-label="Апекс — на главную">
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
