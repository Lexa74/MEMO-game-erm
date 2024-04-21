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
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = () => {
    getAllScore()
      .then(data => {
        setLeaders(data.leaders);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const isHardLevel = achievements => achievements && achievements.includes(1);
  const isWithoutSuperpowers = achievements => achievements && achievements.includes(2);

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
                  {isHardLevel(leader.achievements) ? (
                    <>
                      <img
                        src={process.env.PUBLIC_URL + "/puzzle.svg"}
                        alt="Достижение 'сложный режим' открыто"
                        onMouseEnter={() => handleAchievementHover("puzzle", index)}
                        onMouseLeave={handleAchievementLeave}
                      />
                      {hoveredAchievement === "puzzle" && hoveredIndex === index && (
                        <div className={styles.tooltipHardLevel}>
                          <ToolTips text={"Игра пройдена в сложном режиме"} />
                        </div>
                      )}
                    </>
                  ) : (
                    <img src={process.env.PUBLIC_URL + "/no-puzzle.svg"} alt="Достижение 'сложный режим' не открыто" />
                  )}
                  {isWithoutSuperpowers(leader.achievements) ? (
                    <>
                      <img
                        src={process.env.PUBLIC_URL + "/magic_ball.svg"}
                        alt="Достижение 'не использовать суперсилы' открыто"
                        onMouseEnter={() => handleAchievementHover("magicBall", index)}
                        onMouseLeave={handleAchievementLeave}
                      />
                      {hoveredAchievement === "magicBall" && hoveredIndex === index && (
                        <div className={styles.tooltipWithoutSuperPower}>
                          <ToolTips text={"Игра пройдена без супер-сил"} />
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={process.env.PUBLIC_URL + "/no-magic_ball.svg"}
                      alt="Достижение 'не использовать суперсилы' не открыто"
                    />
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
