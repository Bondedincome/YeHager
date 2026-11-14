/**
 * Single source for every icon on the site.
 *
 * All icons come from lucide-react and share one style (24px grid, 1.5 stroke,
 * round caps). The stroke width is set globally in globals.css via `svg.lucide`.
 * Lucide no longer ships brand logos, so the social icons below are drawn in the
 * same outline style and carry the `lucide` class so they match exactly.
 *
 * Sizes: use `size-5` (20px) for header / standalone icons and `size-4` (16px)
 * for icons sitting next to text.
 */
import React from "react";

export {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Heart,
  Image as ImageIcon,
  LayoutTemplate,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  PanelLeft,
  PanelLeftClose,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

type BrandIconProps = React.SVGProps<SVGSVGElement>;

function BrandIcon({ className = "", children, ...props }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`lucide ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
}

export function InstagramIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </BrandIcon>
  );
}

export function FacebookIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2H7" />
    </BrandIcon>
  );
}

export function TiktokIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </BrandIcon>
  );
}

export function TelegramIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <path d="m15 10-4 4 6 6 4-16-18 7 4 2 2 6 3-4" />
    </BrandIcon>
  );
}
