import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BulonetNavLinkProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, BulonetNavLinkProps>(
  ({ to, className = "", activeClassName = "", children, ...props }, ref) => {
    const isExternal = typeof to === "string" && (to.startsWith("http://") || to.startsWith("https://"));

    if (isExternal) {
      return (
        <a ref={ref as React.ForwardedRef<HTMLAnchorElement>} href={to as string} target="_blank" rel="noopener noreferrer" className={className}>
          {children as React.ReactNode}
        </a>
      );
    }

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive }) => cn(className, isActive && activeClassName)}
        {...props}
      >
        {(typeof children === 'function' ? undefined : children) as React.ReactNode}
      </RouterNavLink>
    );
  }
);

NavLink.displayName = "NavLink";
export { NavLink };
