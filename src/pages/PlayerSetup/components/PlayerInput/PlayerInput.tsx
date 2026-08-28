import type { TPlayerColour } from '../../../../types';
import BotIcon from '../../../../assets/icons/bot.svg?react';
import HumanIcon from '../../../../assets/icons/human.svg?react';
import { playerColours } from '../../../../game/players/constants';
import { ProfileAvatar } from '../../../../components/ProfileAvatar/ProfileAvatar';
import 'react-tooltip/dist/react-tooltip.css';
import styles from './PlayerInput.module.css';

type Props = {
  colour: TPlayerColour;
  isBot: boolean;
  name: string;
  photoBlob: Blob | null;
  hasProfile: boolean;
  onBotStatusChange: (isBot: boolean) => void;
  onChooseProfile: () => void;
};

function PlayerInput({
  colour,
  isBot,
  name,
  photoBlob,
  hasProfile,
  onBotStatusChange,
  onChooseProfile,
}: Props) {
  return (
    <div className={styles.playerInput}>
      <span
        className={styles.playerInputColourDot}
        style={{ backgroundColor: playerColours[colour] }}
      />

      {isBot ? (
        <div className={styles.seat}>
          <span className={styles.botAvatar} aria-hidden="true">
            <BotIcon />
          </span>
          <span className={styles.seatName}>Bot</span>
        </div>
      ) : (
        <button type="button" className={styles.seat} onClick={onChooseProfile}>
          <ProfileAvatar name={hasProfile ? name : '?'} photoBlob={photoBlob} size={40} />
          <span className={styles.seatName}>
            {hasProfile ? name : <span className={styles.placeholder}>Choose player</span>}
          </span>
        </button>
      )}

      <button
        className={styles.botStatusBtn}
        data-tooltip-id="bot-status-tooltip"
        data-tooltip-content={isBot ? 'Bot' : 'Human'}
        aria-label="Toggle Ludo bot on or off"
        onClick={() => onBotStatusChange(!isBot)}
      >
        {isBot ? <BotIcon /> : <HumanIcon />}
      </button>
    </div>
  );
}

export default PlayerInput;
