/**
 * Input — Reusable labelled text input with error state support.
 *
 * Forwards its ref so parent forms can focus or validate programmatically.
 * Renders an optional label and an error message below the field.
 *
 * @param {string}  label     - Field label text
 * @param {string}  error     - Validation error message (shown in red below the input)
 * @param {string}  className - Additional classes for the input element
 * @param {string}  id        - HTML id (falls back to props.name)
 * @param {boolean} required  - Shows a red asterisk next to the label when true
 */
import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  ({ label, error, className, id, required, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600 dark:text-danger-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
