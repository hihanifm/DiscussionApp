import { useRef, useEffect, useCallback } from 'react';

/**
 * Auto-expanding textarea component that starts as a single line
 * and expands as the user types more content.
 */
function AutoExpandingTextarea({ value, onChange, placeholder, disabled, ...props }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on scrollHeight, with a minimum of one line
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
      const minHeight = lineHeight + 24; // padding (12px top + 12px bottom)
      const maxHeight = 200; // Maximum height before scrolling
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      // Enable scrolling if content exceeds max height
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Adjust height on mount
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows="1"
      style={{
        resize: 'none',
        minHeight: '44px', // Single line height with padding
        maxHeight: '200px', // Maximum height before scrolling
      }}
      {...props}
    />
  );
}

export default AutoExpandingTextarea;
