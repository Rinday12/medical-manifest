import React from "react";

const Input = ({ id, value, onChange, placeholder }) => (
  <input
    id={id}
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
  />
);

export default Input;
