import styles from "./tooltip.module.css";

export function ToolTips({ title, text }) {
  return (
    <div className={styles.toolTip}>
      <p className={styles.toolTipTitle}>{title}</p>
      <p className={styles.toolTipText}>{text}</p>
    </div>
  );
}
