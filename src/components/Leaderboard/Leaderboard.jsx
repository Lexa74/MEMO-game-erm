import { useEffect, useState } from "react";
import { getAllScore } from "../../api";
import styles from "./Leaderboard.module.css";
import { formatTime } from "../../helpers";
import { ToolTips } from "../../utils/tooltips/tooltip";

export function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    loadLeaderboardData(); // Загрузка данных лидерборда при монтировании компонента
  }, []);

  const loadLeaderboardData = () => {
    getAllScore()
      .then(data => {
        setLeaders(data.leaders); // Обновление данных лидерборда
      })
      .catch(error => {
        console.error(error);
      });
  };

  const handleAchievementHover = (achievement, index) => {
    setHoveredAchievement(achievement);
    setHoveredIndex(index);
  };

  const handleAchievementLeave = () => {
    setHoveredAchievement(null);
    setHoveredIndex(null);
  };

  return (
    <div className={styles.leaderboardContainer}>
      <div className={`${styles.leaderboard} ${styles.leaderboardTitle}`}>
        <p className={styles.item}>Позиция</p>
        <p className={styles.itemName}>Пользователь</p>
        <p className={styles.item}>Достижения</p>
        <p className={styles.item}>Время</p>
      </div>
      <>
        {leaders
          .slice()
          .sort((a, b) => a.time - b.time)
          .map((leader, index) => {
            const position = index + 1;
            return (
              <div className={styles.leaderboard} key={index}>
                <p className={styles.item}>{`# ${position}`}</p>
                <p className={styles.itemName}>{leader.name}</p>
                <div className={`${styles.itemContainer} ${styles.toolTipPiphany}`}>
                  <img
                    src="./no-puzzle.svg"
                    alt="Достижение 'сложный режим' не открыто"
                    onMouseEnter={() => handleAchievementHover("puzzle", index)}
                    onMouseLeave={handleAchievementLeave}
                  />
                  {hoveredAchievement === "puzzle" && hoveredIndex === index && (
                    <div className={styles.tooltipHardLevel}>
                      <ToolTips text={"Игра пройдена в сложном режиме"} />
                    </div>
                  )}
                  <img
                    src="./no-magic_ball.svg"
                    alt="Достижение 'не использовать суперсилы' не открыто"
                    onMouseEnter={() => handleAchievementHover("magicBall", index)}
                    onMouseLeave={handleAchievementLeave}
                  />
                  {hoveredAchievement === "magicBall" && hoveredIndex === index && (
                    <div className={styles.tooltipWithoutSuperPower}>
                      <ToolTips text={"Игра пройдена без супер-сил"} />
                    </div>
                  )}
                </div>
                <p className={styles.item}>{formatTime(leader.time)}</p>
              </div>
            );
          })}
      </>
    </div>
  );
}
