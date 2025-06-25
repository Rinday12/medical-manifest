import React from "react";

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block font-medium text-gray-700">
    {children}
  </label>
);

export default Label;
