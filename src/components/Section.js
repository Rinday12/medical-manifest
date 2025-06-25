import React from "react";

const Section = ({ title, children }) => (
  <section className="bg-white rounded-xl p-6 shadow-md border space-y-4">
    {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
    {children}
  </section>
);

export default Section;
