import dice1 from '../../../../assets/theme/dice-1.png';
import dice2 from '../../../../assets/theme/dice-2.png';
import dice3 from '../../../../assets/theme/dice-3.png';
import dice4 from '../../../../assets/theme/dice-4.png';
import dice5 from '../../../../assets/theme/dice-5.png';
import dice6 from '../../../../assets/theme/dice-6.png';
import dicePlaceholder from '../../../../assets/dice/dice_placeholder.gif';
import rerollBtn from '../../../../assets/theme/btn-reroll.png';
import frameGreen from '../../../../assets/theme/avatar-frame-green.png';
import frameRed from '../../../../assets/theme/avatar-frame-red.png';
import frameYellow from '../../../../assets/theme/avatar-frame-yellow.png';
import frameBlue from '../../../../assets/theme/avatar-frame-blue.png';
import { useCallback, useEffect, useMemo } from 'react';
import { type TPlayerColour } from '../../../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { ERRORS } from '../../../../utils/errors';
import { playerColours } from '../../../../game/players/constants';
import { isAnyTokenActiveOfColour } from '../../../../game/tokens/logic';
import styles from './Dice.module.css';
import clsx from 'clsx';
import { useRollDice } from '../../../../hooks/useRollDice';
import { useHandlePostDiceRoll } from '../../../../hooks/useHandlePostDiceRoll';
import { useChangeTurn } from '../../../../hooks/useChangeTurn';
import { logError } from '../../../../utils/logError';
import { ProfilePhoto } from '../../../../components/ProfilePhoto/ProfilePhoto';
import { H } from '../../../../components/H/H';

type Props = {
  colour: TPlayerColour;
  playerName: string;
  profileId: string | null;
};

const FRAME_BY_COLOUR: Record<TPlayerColour, string> = {
  green: frameGreen,
  red: frameRed,
  yellow: frameYellow,
  blue: frameBlue,
};

function getDiceImage(diceNumber: number | undefined): string {
  switch (diceNumber) {
    case 1:
      return dice1;
    case 2:
      return dice2;
    case 3:
      return dice3;
    case 4:
      return dice4;
    case 5:
      return dice5;
    case 6:
      return dice6;
    default:
      throw new Error(ERRORS.invalidDiceNumber(diceNumber as never));
  }
}

export default function Dice({ colour, playerName, profileId }: Props) {
  const {
    isAnyTokenMoving,
    isGameEnded,
    currentPlayerColour: currentPlayer,
    players,
  } = useSelector((state: RootState) => state.players);
  const { diceNumber, isPlaceholderShowing } =
    useSelector((state: RootState) => state.dice.dice.find((d) => d.colour === colour)) ?? {};

  const anyTokenActive = useMemo(
    () => isAnyTokenActiveOfColour(colour, players),
    [colour, players]
  );
  const handlePostDiceRoll = useHandlePostDiceRoll();
  const changeTurnFn = useChangeTurn();
  const rollDice = useRollDice();
  const player = players.find((p) => p.colour === colour);
  const isBot = player?.isBot;
  const kills = player?.kills ?? 0;
  const deaths = player?.deaths ?? 0;
  const isCurrentPlayer = currentPlayer === colour;
  const isDiceDisabled =
    !isCurrentPlayer ||
    anyTokenActive ||
    isAnyTokenMoving ||
    isGameEnded ||
    isPlaceholderShowing ||
    isBot;

  // The corner slot shows one of three things:
  //  - avatar frame  (idle / not this player's turn)
  //  - roll button   (this human's turn, before they've rolled)
  //  - dice face     (mid-roll or after rolling, incl. the whole bot turn)
  const showRollButton = isCurrentPlayer && !isBot && !isPlaceholderShowing && !anyTokenActive;
  const showDiceFace = isCurrentPlayer && !showRollButton;

  const handleDiceClick = useCallback(async () => {
    if (isDiceDisabled) return;
    const diceNumber = await rollDice(colour);
    const res = await handlePostDiceRoll(colour, diceNumber);
    if (res?.shouldChangeTurn) changeTurnFn();
  }, [colour, handlePostDiceRoll, isDiceDisabled, rollDice, changeTurnFn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== 'd' || isDiceDisabled) return;
      handleDiceClick().catch(logError('Dice.handleKeyDown'));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiceClick, isDiceDisabled]);

  return (
    <div className={clsx(styles.diceContainer, styles[colour])}>
      <span className={styles.stats}>
        <span className={styles.stat} title="Captures made" aria-label={`${kills} captures made`}>
          <H c="⚔️" /> {kills}
        </span>
        <span
          className={styles.stat}
          title="Tokens sent home by others"
          aria-label={`${deaths} tokens sent home`}
        >
          <H c="💀" /> {deaths}
        </span>
      </span>

      <span className={styles.slot}>
        {showRollButton ? (
          <button
            className={clsx(styles.dice, styles.rollBtn, styles.active)}
            title="Roll Dice (Press D)"
            style={{ '--player-colour': playerColours[colour] } as React.CSSProperties}
            type="button"
            onClick={handleDiceClick}
          >
            <img src={rerollBtn} alt={`Roll dice for ${playerName}`} />
          </button>
        ) : showDiceFace ? (
          <span className={clsx(styles.dice, styles.diceFace, { [styles.rolling]: isPlaceholderShowing })}>
            <img
              src={isPlaceholderShowing ? dicePlaceholder : getDiceImage(diceNumber)}
              alt="Dice"
              aria-hidden="true"
            />
          </span>
        ) : (
          <span className={styles.avatar}>
            <span className={styles.avatarPhoto}>
              <ProfilePhoto profileId={profileId} name={playerName} size={44} />
            </span>
            <img className={styles.avatarFrame} src={FRAME_BY_COLOUR[colour]} alt="" aria-hidden="true" />
          </span>
        )}
      </span>

      {isCurrentPlayer && (
        <span className={styles.pointer} aria-hidden="true">
          <H c="👉" />
        </span>
      )}
    </div>
  );
}
