/**
 * Utility classes for consistent button animations across the app
 */

export const buttonAnimations = {
  // Basic hover animation
  hover:
    "transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md",

  // Pulse animation for important actions
  pulse:
    "transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md animate-pulse",

  // Bounce animation for playful interactions
  bounce:
    "transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md hover:animate-bounce",

  // Rotate animation for toggle buttons
  rotate:
    "transition-all duration-200 transform hover:rotate-12 hover:scale-105 active:scale-95 hover:shadow-md",

  // Slide animation for modal/drawer triggers
  slide:
    "transition-all duration-200 transform hover:translate-x-1 hover:scale-105 active:scale-95 hover:shadow-md",

  // Glow effect for primary actions
  glow: "transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/25",

  // Subtle animation for secondary actions
  subtle:
    "transition-all duration-200 transform hover:scale-102 active:scale-95 hover:shadow-sm",

  // Icon button animations
  iconButton:
    "transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-md",

  // Destructive action animation
  destructive:
    "transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-destructive/25",

  // Loading state animation
  loading: "transition-all duration-200 animate-pulse cursor-not-allowed",
} as const;

// CSS classes for modal animations
export const modalAnimations = {
  backdrop: "animate-in fade-in-0 duration-200",
  content: "animate-in zoom-in-95 slide-in-from-bottom-2 duration-200",
  exit: "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-2 duration-200",
} as const;

// Helper function to combine animation classes
export function combineAnimations(...animations: string[]): string {
  return animations.join(" ");
}

// Common button class combinations
export const buttonPresets = {
  primary: combineAnimations(buttonAnimations.hover, buttonAnimations.glow),
  secondary: combineAnimations(buttonAnimations.hover, buttonAnimations.subtle),
  destructive: combineAnimations(
    buttonAnimations.hover,
    buttonAnimations.destructive
  ),
  icon: buttonAnimations.iconButton,
  toggle: buttonAnimations.rotate,
  modal: combineAnimations(buttonAnimations.hover, buttonAnimations.glow),
} as const;
