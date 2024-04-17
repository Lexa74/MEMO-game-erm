import styles from "./Superpowers.module.css";

export function AlohomoraPower({
  isAvailable,
  onClick,
  onMouseEnter,
  onMouseLeave,
  setIsAlohomoraHover,

  // setIsPiphanyHover,
  // isPiphanyAvailable,
}) {
  return isAvailable ? (
    <div
      className={styles.superpowerContainer}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter({ setIsAlohomoraHover })}
      onMouseLeave={() => onMouseLeave({ setIsAlohomoraHover })}
    >
      <img className={styles.superpowerIcon} src="../power-alohomora.svg" alt="Суперсила алохомора" />
    </div>
  ) : (
    ""
  );
}
