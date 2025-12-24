import React from "react";
import styles from "./FloatingButtonGroup.module.css";

export interface FloatingButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface FloatingButtonGroupProps {
  buttons: FloatingButton[];
  activeButtonId?: string;
}

export default function FloatingButtonGroup({
  buttons,
  activeButtonId,
}: FloatingButtonGroupProps) {
  return (
    <div className={styles.floatingToggle}>
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          className={`${styles.floatingButton} ${
            activeButtonId === button.id ? styles.floatingButtonActive : ""
          }`}
        >
          {button.icon && <span className={styles.buttonIcon}>{button.icon}</span>}
          {button.label}
        </button>
      ))}
    </div>
  );
}
