/**
 * Button — Reusable button component with variant, size, and loading state support.
 *
 * @param {React.ReactNode} children    - Button label / content
 * @param {'primary'|'secondary'|'danger'|'outline'|'ghost'} [variant='primary'] - Visual style
 * @param {'sm'|'md'|'lg'} [size='md'] - Size preset
 * @param {boolean} [loading=false]    - Shows a spinner and disables the button
 * @param {boolean} [disabled=false]   - Disables the button without showing a spinner
 * @param {string}  [className]        - Extra Tailwind classes to merge
 * @param {'button'|'submit'|'reset'} [type='button'] - HTML button type
 *
 * Uses forwardRef so parent components can access the underlying <button> element.
 * Supports dark mode via Tailwind dark: variants defined in the variants/sizes maps.
 */
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 focus:ring-primary-500',
  secondary: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-600 focus:ring-secondary-500',
  danger: 'bg-danger-600 dark:bg-danger-500 text-white hover:bg-danger-700 dark:hover:bg-danger-600 focus:ring-danger-500',
  outline: 'border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:ring-primary-500',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
