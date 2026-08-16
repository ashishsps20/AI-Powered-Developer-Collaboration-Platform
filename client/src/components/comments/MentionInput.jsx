import React from 'react';

const MentionInput = ({ value, onChange, placeholder, disabled }) => {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value, [])}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full text-sm border border-gray-300 rounded-md p-2"
      rows={3}
    />
  );
};

export default MentionInput;
