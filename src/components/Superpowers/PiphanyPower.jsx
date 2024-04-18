import styles from "./Superpowers.module.css";

export function PiphanyPower({
  isAvailable,
  onClick,
  onMouseEnter,
  onMouseLeave,
  setIsPiphanyHover,
  // isAlohomoraHover,
  // isAlohomoraAvailable,
}) {
  return (
    <div
      className={styles.superpowerContainer}
      style={{ visibility: isAvailable ? "visible" : "hidden" }}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter({ setIsPiphanyHover })}
      onMouseLeave={() => onMouseLeave({ setIsPiphanyHover })}
    >
      <img className={styles.superpowerIcon} src="../power-piphany.svg" alt="Суперсила прозрение" />
    </div>
  );
}
