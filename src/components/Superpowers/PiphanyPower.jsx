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
  return isAvailable ? (
    <div
      className={styles.superpowerContainer}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter({ setIsPiphanyHover })}
      onMouseLeave={() => onMouseLeave({ setIsPiphanyHover })}
    >
      <img className={styles.superpowerIcon} src="../power-piphany.svg" alt="Суперсила прозрение" />
    </div>
  ) : (
    ""
  );
}
