import React from "react";
import styles from "./Btn.module.css";

const Btn = ({
  text,
  icon,
  background = "transparent",
  border = "none",
  textColor = "#4629F2",
  width = "5rem",
  textBorder = false,
  onClick,
  height = "3rem",
  disabled = false,
}) => {
  const buttonStyle = {
    backgroundColor: background !== "none" ? background : "transparent",
    border: border !== "none" ? `1px solid ${border}` : "none",
    color: disabled ? "#ccc" : textColor,
    width: width,
    height: height,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <button
      className={`${styles.btnWrap} ${
        background === "none" ? styles.line : ""
      }`}
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {text && (
        <span
          className={`${styles.text} ${textBorder ? styles.textUnderline : ""}`}
        >
          {text}
        </span>
      )}
    </button>
  );
};

export default Btn;
