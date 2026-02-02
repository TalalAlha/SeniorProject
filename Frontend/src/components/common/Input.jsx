import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  ({ label, error, className, id, required, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
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
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-gray-300 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
