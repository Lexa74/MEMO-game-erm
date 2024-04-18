import { shuffle } from "lodash";
import { useEffect, useState } from "react";
import { generateDeck } from "../../utils/cards";
import styles from "./Cards.module.css";
import { EndGameModal } from "../../components/EndGameModal/EndGameModal";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { useDispatch, useSelector } from "react-redux";
import { removeAttempts, updateAttempts } from "../../store/slices";
import { attemptForms, wordEndingChanger } from "../../helpers";
import { getAllScore } from "../../api";
import { AlohomoraPower } from "../Superpowers/AlohomoraPower";
import { PiphanyPower } from "../Superpowers/PiphanyPower";
import { ToolTips } from "../../utils/tooltips/tooltip";

// Игра закончилась
const STATUS_LOST = "STATUS_LOST";
const STATUS_WON = "STATUS_WON";
// Идет игра: карты закрыты, игрок может их открыть
const STATUS_IN_PROGRESS = "STATUS_IN_PROGRESS";
// Начало игры: игрок видит все карты в течении нескольких секунд
const STATUS_PREVIEW = "STATUS_PREVIEW";
// Игра на паузе
const STATUS_PAUSED = "STATUS_PAUSED";

function getTimerValue(startDate, endDate) {
  if (!startDate && !endDate) {
    return {
      minutes: 0,
      seconds: 0,
    };
  }

  if (endDate === null) {
    endDate = new Date();
  }

  const diffInSecconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  const minutes = Math.floor(diffInSecconds / 60);
  const seconds = diffInSecconds % 60;
  return {
    minutes,
    seconds,
  };
}

/**
 * Основной компонент игры, внутри него находится вся игровая механика и логика.
 * pairsCount - сколько пар будет в игре
 * previewSeconds - сколько секунд пользователь будет видеть все карты открытыми до начала игры
 * Обычный режим: 1 ошибка = поражение
 * Облегченный режим: 3 ошибки = поражение
 */
export function Cards({ pairsCount = 3, previewSeconds = 5 }) {
  const dispatch = useDispatch();

  // В cards лежит игровое поле - массив карт и их состояние открыта\закрыта
  const [cards, setCards] = useState([]);
  // Текущий статус игры
  const [status, setStatus] = useState(STATUS_PREVIEW);

  // Дата начала игры
  const [gameStartDate, setGameStartDate] = useState(null);
  // Дата конца игры
  const [gameEndDate, setGameEndDate] = useState(null);

  // Стейт для таймера, высчитывается в setInteval на основе gameStartDate и gameEndDate
  const [timer, setTimer] = useState({
    seconds: 0,
    minutes: 0,
  });

  // количество оставшихся попыток
  const attempts = useSelector(store => store.game.attempts);

  // Статус режима игры до трех ошибок
  const isEasyMode = useSelector(store => store.game.isEasyMode);

  // Если допущено 3 ошибки, игра заканчивается
  useEffect(() => {
    if (attempts === 0) {
      finishGame(STATUS_LOST);
    }
  });

  function finishGame(status = STATUS_LOST) {
    dispatch(removeAttempts());
    setGameEndDate(new Date());
    setStatus(status);
  }
  function startGame() {
    const startDate = new Date();
    setGameEndDate(null);
    setGameStartDate(startDate);
    setTimer(getTimerValue(startDate, null));
    setStatus(STATUS_IN_PROGRESS);
    setIsPiphanyAvailable(true);
    setIsPiphanyHover(false);
    setIsAlohomoraAvailable(true);
    setIsAlohomoraHover(false);
  }

  function resetGame() {
    dispatch(removeAttempts());
    setGameStartDate(null);
    setGameEndDate(null);
    setTimer(getTimerValue(null, null));
    setStatus(STATUS_PREVIEW);
  }

  /**
   * Обработка основного действия в игре - открытие карты.
   * После открытия карты игра может переходить в следующие состояния
   * - "Игрок выиграл", если на поле открыты все карты
   * - "Игрок проиграл", если на поле есть две открытые карты без пары
   * - "Игра продолжается", если не случилось первых двух условий
   */
  const openCard = clickedCard => {
    // Если карта уже открыта, то ничего не делаем
    if (clickedCard.open) {
      return;
    }
    // Игровое поле после открытия кликнутой карты
    const nextCards = cards.map(card => {
      if (card.id !== clickedCard.id) {
        return card;
      }

      return {
        ...card,
        open: true,
      };
    });

    setCards(nextCards);

    const isPlayerWon = nextCards.every(card => card.open);

    // Победа - все карты на поле открыты
    if (isPlayerWon) {
      finishGame(STATUS_WON);
      return;
    }

    // Открытые карты на игровом поле
    const openCards = nextCards.filter(card => card.open);

    // Ищем открытые карты, у которых нет пары среди других открытых
    const openCardsWithoutPair = openCards.filter(card => {
      const sameCards = openCards.filter(openCard => card.suit === openCard.suit && card.rank === openCard.rank);

      if (sameCards.length < 2) {
        return true;
      }

      return false;
    });

    const playerLost = openCardsWithoutPair.length >= 2;

    // Если на поле 2 открытые карты без пары - Обычный режим: "Игрок проиграл". Облегченный режим: "Игра продолжается"
    if (playerLost) {
      dispatch(updateAttempts());

      if (!isEasyMode) {
        finishGame(STATUS_LOST);
      } else {
        const updatedCards = nextCards.map(card => {
          if (openCardsWithoutPair.some(openCard => openCard.id === card.id)) {
            if (card.open) {
              setTimeout(() => {
                setCards(prevCards => {
                  const updated = prevCards.map(cardId =>
                    cardId.id === card.id ? { ...cardId, open: false } : cardId,
                  );
                  return updated;
                });
              }, 1000);
            }
          }
          return card;
        });
        setCards(updatedCards);
      }
      return;
    }
  };

  const isGameEnded = status === STATUS_LOST || status === STATUS_WON;

  //при победе на уровне игры 3 и если результат по времени лучше чем у последнего игрока в лидерборде, устанавливаем isLeader в true для внесение игрока в лидерборд
  const [isLeader, setIsLeader] = useState(false);
  const currentLevel = useSelector(store => store.game.currentLevel);

  useEffect(() => {
    if (status === STATUS_WON && currentLevel === 3) {
      getAllScore()
        .then(data => {
          const leaders = data.leaders; // Получаем список лидеров из API
          console.log("Все лидеры:", leaders);
          const timeLastLeaders = leaders.reduce((maxTime, leader) => {
            return Math.max(maxTime, leader.time);
          }, 0);
          console.log("Время последнего лидера:", timeLastLeaders);

          const { minutes, seconds } = timer;
          const userTime = minutes * 60 + seconds;
          console.log("Таймер пользователя:", userTime);
          if (timeLastLeaders > userTime || leaders.length < 10) {
            setIsLeader(true);
            console.log("Пользователь - лидер!");
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  }, [status, currentLevel]);

  // Игровой цикл
  useEffect(() => {
    // В статусах кроме превью доп логики не требуется
    if (status !== STATUS_PREVIEW) {
      return;
    }

    // В статусе превью мы
    if (pairsCount > 36) {
      alert("Столько пар сделать невозможно");
      return;
    }

    setCards(() => {
      return shuffle(generateDeck(pairsCount, 10));
    });

    const timerId = setTimeout(() => {
      startGame();
    }, previewSeconds * 1000);

    return () => {
      clearTimeout(timerId);
    };
  }, [status, pairsCount, previewSeconds]);

  // Добавляем состояние для хранения идентификатора таймера
  const [timeoutId, setTimeoutId] = useState(null);

  // Обновляем значение таймера в интервале
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer(getTimerValue(gameStartDate, gameEndDate));
    }, 300);

    // Сохраняем идентификатор таймера в состоянии
    setTimeoutId(intervalId);

    return () => {
      // Очищаем таймер при размонтировании компонента или изменении зависимостей
      clearInterval(intervalId);
    };
  }, [gameStartDate, gameEndDate]);

  //устанавливаем корректное окончание слова "попытка" в зависимости от оставшегося числа попыток
  const attemptsText = wordEndingChanger.changeEnding(attempts, attemptForms);

  //Реализация суперсил
  const [isPiphanyAvailable, setIsPiphanyAvailable] = useState(true); // Доступно ли использование "Прозрение"
  const [isAlohomoraAvailable, setIsAlohomoraAvailable] = useState(true); // Доступно ли использование "Алохомора"
  const [isPiphanyHover, setIsPiphanyHover] = useState(false);
  const [isAlohomoraHover, setIsAlohomoraHover] = useState(false);

  const onPiphanyHover = () => {
    setIsPiphanyHover(true);
  };

  const onPiphanyHoverLeave = () => {
    setIsPiphanyHover(false);
  };

  const onAlohomoraHover = () => {
    setIsAlohomoraHover(true);
  };

  const onAlohomoraHoverLeave = () => {
    setIsAlohomoraHover(false);
  };

  //суперсила "Прозрение": На 5 секунд показываются все карты. Таймер длительности игры на это время останавливается.
  function usePiphany() {
    // Очищаем предыдущий таймер, если он был установлен
    clearTimeout(timeoutId);

    // Останавливаем таймер
    setStatus(STATUS_PAUSED);
    setIsPiphanyAvailable(false);

    // Сохраняем текущее время
    const currentTime = new Date().getTime();

    // Запускаем таймер через 5 секунд
    const newTimeoutId = setTimeout(() => {
      // Возобновляем игру и обновляем время начала игры
      setGameStartDate(prevStartDate => {
        // Вычисляем разницу времени между текущим временем и временем остановки таймера
        const timeDifference = new Date().getTime() - currentTime;
        // Возвращаем новое время начала игры, с учетом времени остановки таймера
        return new Date(prevStartDate.getTime() + timeDifference);
      });
      setStatus(STATUS_IN_PROGRESS);
    }, 5000);

    // Обновляем состояние timeoutId
    setTimeoutId(newTimeoutId);
  }

  //суперсила "Алохомора": Открывается случайная пара карт.
  function useAlohomora() {
    setIsAlohomoraAvailable(false);

    const closedCards = cards.filter(card => !card.open);

    const firstRandomIndex = Math.floor(Math.random() * closedCards.length);
    const firstRandomCard = closedCards[firstRandomIndex];

    closedCards.splice(firstRandomIndex, 1);

    const secondRandomIndex = Math.floor(Math.random() * (closedCards.length - 1));
    const secondRandomCard = closedCards[secondRandomIndex];

    closedCards.splice(secondRandomIndex, 1);

    setCards(
      cards.map(card => {
        if (card === firstRandomCard || card === secondRandomCard) {
          return { ...card, open: true };
        } else {
          return card;
        }
      }),
    );

    //проверка на победу
    const isPlayerWon = closedCards.every(card => card.open);

    if (isPlayerWon) {
      finishGame(STATUS_WON);
      return;
    }
  }

  const withoutSuperpowers = isPiphanyAvailable && isAlohomoraAvailable;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.timerContainer}>
          {status === STATUS_PREVIEW ? (
            <div>
              <p className={styles.previewText}>Запоминайте пары!</p>
              <p className={styles.previewDescription}>Игра начнется через {previewSeconds} секунд</p>
            </div>
          ) : (
            <>
              <div className={styles.timer}>
                <div className={styles.timerValue}>
                  <div className={styles.timerDescription}>min</div>
                  <div>{timer.minutes.toString().padStart(2, "0")}</div>
                </div>
                .
                <div className={styles.timerValue}>
                  <div className={styles.timerDescription}>sec</div>
                  <div>{timer.seconds.toString().padStart(2, "0")}</div>
                </div>
              </div>
              {isEasyMode && (status === STATUS_IN_PROGRESS || status === STATUS_PAUSED) ? (
                <div className={styles.attempts}>
                  <p>
                    Осталось <span>{attempts}</span>
                    {attemptsText}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
        {status === STATUS_IN_PROGRESS || status === STATUS_PAUSED ? (
          <div className={styles.buttonContainer}>
            <div className={styles.powersContainer}>
              {status === STATUS_IN_PROGRESS || status === STATUS_PAUSED ? (
                <>
                  <PiphanyPower
                    isAvailable={isPiphanyAvailable}
                    onClick={usePiphany}
                    onMouseEnter={onPiphanyHover}
                    onMouseLeave={onPiphanyHoverLeave}
                    setIsPiphanyHover={setIsPiphanyHover}
                    isAlohomoraHover={isAlohomoraHover}
                    isAlohomoraAvailable={isAlohomoraAvailable}
                  />
                  <AlohomoraPower
                    isAvailable={isAlohomoraAvailable}
                    onClick={useAlohomora}
                    onMouseEnter={onAlohomoraHover}
                    onMouseLeave={onAlohomoraHoverLeave}
                    setIsAlohomoraHover={setIsAlohomoraHover}
                    isPiphanyHover={isPiphanyHover}
                    isPiphanyAvailable={isPiphanyAvailable}
                  />
                  {(isPiphanyHover && isPiphanyAvailable) || (isAlohomoraHover && isAlohomoraAvailable) ? (
                    <>
                      {isPiphanyHover && isPiphanyAvailable && (
                        <div className={isAlohomoraAvailable ? styles.toolTipPiphany : ""}>
                          <ToolTips
                            title={"Прозрение"}
                            text={
                              "На 5 секунд показываются все карты. Таймер длительности игры на это время останавливается."
                            }
                          />
                        </div>
                      )}
                      {isAlohomoraHover && isAlohomoraAvailable && (
                        <div className={isPiphanyAvailable ? styles.toolTipAlohomora : ""}>
                          <ToolTips title={"Алохомора"} text={"Открывается случайная пара карт."} />
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
            <Button onClick={resetGame}>Начать заново</Button>
          </div>
        ) : null}
      </div>
      <div className={styles.cards}>
        {cards.map(card => (
          <Card
            key={card.id}
            onClick={() => openCard(card)}
            open={status !== STATUS_IN_PROGRESS ? true : card.open}
            suit={card.suit}
            rank={card.rank}
          />
        ))}
      </div>
      {isGameEnded ? (
        <div className={styles.modalContainer}>
          <EndGameModal
            isWon={status === STATUS_WON}
            gameDurationSeconds={timer.seconds}
            gameDurationMinutes={timer.minutes}
            onClick={resetGame}
            isLeader={isLeader}
            withoutSuperpowers={withoutSuperpowers}
          />
        </div>
      ) : null}
    </div>
  );
}
