"use client";

import { useMediaQuery } from "@uidotdev/usehooks";
import PropTypes from "prop-types";
import { useState } from "react";

const TextBox = ({ title, subTitle, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (content, title) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(title);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div
      key={title}
      style={{ display: "flex", flexDirection: "column", gap: "5px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div>{title}</div>
          <div>{subTitle}</div>
        </div>
        {copied && <span>Copied!</span>}
        <button onClick={() => handleCopy(children, title)}>📋 Copy</button>
      </div>
      <pre
        style={{
          width: "700px",
          whiteSpace: "pre-wrap",
          backgroundColor: isDarkMode ? "#333333" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#000000",
          border: "1px solid grey",
        }}
        contentEditable
      >
        <code>{children}</code>
      </pre>
    </div>
  );
};

TextBox.propTypes = {
  text: PropTypes.string.isRequired,
};

export default TextBox;
