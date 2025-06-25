import React from "react";

const SubmitButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="btn-submit mt-2"
  >
    {children}
  </button>
);

export default SubmitButton;
