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
  return (
    <div
      className={styles.superpowerContainer}
      style={{ visibility: isAvailable ? "visible" : "hidden" }}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter({ setIsAlohomoraHover })}
      onMouseLeave={() => onMouseLeave({ setIsAlohomoraHover })}
    >
      <img className={styles.superpowerIcon} src="../power-alohomora.svg" alt="Суперсила алохомора" />
    </div>
  );
}
