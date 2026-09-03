import { useCallback, useEffect, useMemo, useState } from 'react';
import PlayerInput from './components/PlayerInput/PlayerInput';
import ProfilePicker from './components/ProfilePicker/ProfilePicker';
import { Link, useNavigate, type MetaFunction } from 'react-router';
import type { TPlayerInitData } from '../../types';
import type { TProfile } from '../../types/profiles';
import { listProfiles } from '../../game/profiles/store';
import { ToastContainer, toast } from 'react-toastify';
import { useCleanup } from '../../hooks/useCleanup';
import { playerCountToWord } from '../../game/players/logic';
import { playerSequences } from '../../game/players/constants';
import { PAWN_STYLES } from '../../game/pawns/pawnStyles';
import HomeIcon from '../../assets/icons/home.svg?react';
import styles from './PlayerSetup.module.css';
import { Tooltip } from 'react-tooltip';
import { validateStoredState } from '../../game/storage/validator';
import {
  deleteSaveFromStorage,
  retrieveSaveFromStorage,
  saveExists,
} from '../../game/storage/storage';
import { SAVE_VERSION } from '../../game/storage/constants';
import { logError } from '../../utils/logError';

const toastIds = {
  allBotPlayer: 'all-bot-player',
  playerNameEmpty: 'player-name-empty',
  profileMissing: 'profile-missing',
  corruptedSave: 'corrupted-save',
  incompatibleSave: 'incompatible-save',
} as const satisfies Record<string, string>;

const DEFAULT_PLAYER_DATA: TPlayerInitData[] = [
  { name: '', isBot: false, profileId: null, pawnStyle: 'jelly' },
  { name: '', isBot: false, profileId: null, pawnStyle: 'jelly' },
  { name: '', isBot: false, profileId: null, pawnStyle: 'jelly' },
  { name: '', isBot: false, profileId: null, pawnStyle: 'jelly' },
];

export default function PlayerSetup() {
  const [playerCount, setPlayerCount] = useState(2);
  const [btnsDisabled, setBtnsDisabled] = useState(false);
  const [playersData, setPlayersData] = useState<TPlayerInitData[]>(DEFAULT_PLAYER_DATA);
  const [profiles, setProfiles] = useState<TProfile[]>([]);
  const [pickerSeat, setPickerSeat] = useState<number | null>(null);
  const navigate = useNavigate();
  const cleanup = useCleanup();
  const playerSequence = useMemo(
    () => playerSequences[playerCountToWord(playerCount)],
    [playerCount]
  );

  useEffect(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(logError('PlayerSetup.loadProfiles'));
  }, []);

  const profileById = useCallback(
    (id: string | null) => (id ? (profiles.find((p) => p.id === id) ?? null) : null),
    [profiles]
  );

  // profileIds already assigned to a seat within the active player count.
  const takenProfileIds = useMemo(
    () =>
      new Set(
        playersData
          .slice(0, playerCount)
          .map((d) => d.profileId)
          .filter((id): id is string => id !== null)
      ),
    [playersData, playerCount]
  );

  const handleSelectProfile = (seatIndex: number, profile: TProfile) => {
    setPlayersData((prev) =>
      prev.map((d, i) => (i === seatIndex ? { ...d, name: profile.name, profileId: profile.id } : d))
    );
    setPickerSeat(null);
  };

  const handleCyclePawnStyle = (seatIndex: number) => {
    setPlayersData((prev) =>
      prev.map((d, i) => {
        if (i !== seatIndex) return d;
        const next = PAWN_STYLES[(PAWN_STYLES.indexOf(d.pawnStyle) + 1) % PAWN_STYLES.length];
        return { ...d, pawnStyle: next };
      })
    );
  };

  const handleBotStatusChange = (seatIndex: number, isBot: boolean) => {
    setPlayersData((prev) =>
      prev.map((d, i) =>
        i === seatIndex
          ? isBot
            ? { ...d, isBot: true, name: 'Bot', profileId: null }
            : { ...d, isBot: false, name: '', profileId: null }
          : d
      )
    );
  };

  const handlePlayBtnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    try {
      e.preventDefault();
      if (btnsDisabled) return;
      setBtnsDisabled(true);

      if (saveExists()) {
        const res = confirm('Start a new game? Your current save will be lost');
        if (!res) return setBtnsDisabled(false);
      }

      deleteSaveFromStorage(); // this is to prevent the old game from getting loaded

      // Any human seat left blank just gets a default name (its colour), so a
      // player can tap PLAY straight away without choosing or adding anyone.
      const playerInitData = playersData.slice(0, playerCount).map((d, i) => {
        if (d.isBot || d.name.trim()) return d;
        const colour = playerSequence[i];
        return { ...d, name: colour.charAt(0).toUpperCase() + colour.slice(1) };
      });
      const areAllPlayersBot = playerInitData.every((d) => d.isBot);

      if (areAllPlayersBot) {
        toast('There must be at least one human player', {
          type: 'error',
          toastId: toastIds.allBotPlayer,
        });
      } else {
        return void navigate('/play', { state: { initData: playerInitData } });
      }
      setBtnsDisabled(false);
    } catch (e) {
      logError('PlayerSetup.handlePlayBtnClick')(e);
      setBtnsDisabled(false);
    }
  };

  const handleLoadLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    try {
      e.preventDefault();
      if (btnsDisabled) return;
      setBtnsDisabled(true);
      const { success, data } = validateStoredState(retrieveSaveFromStorage());
      if (!success) {
        toast("Save file does not exist or it's corrupted", {
          type: 'error',
          toastId: toastIds.corruptedSave,
        });
      } else if (data.version !== SAVE_VERSION) {
        toast(`Incompatible save: v${data.version} (requires v${SAVE_VERSION})`, {
          type: 'error',
          toastId: toastIds.incompatibleSave,
        });
      } else {
        return void navigate('/play');
      }
      setBtnsDisabled(false);
    } catch (e) {
      logError('PlayerSetup.handleLoadLinkClick')(e);
      setBtnsDisabled(false);
    }
  };

  return (
    <div className={styles.playerSetup}>
      <main
        className={styles.playerSetupDialog}
        style={{ '--player-count': playerCount } as React.CSSProperties}
      >
        <div className={styles.playerCountSelector}>
          {[2, 3, 4].map((n) => (
            <button className={styles.playerCount} key={n} onClick={() => setPlayerCount(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className={styles.playerInputs}>
          {playerSequence.map((c, index) => (
            <PlayerInput
              colour={c}
              name={playersData[index].name}
              isBot={playersData[index].isBot}
              hasProfile={playersData[index].profileId !== null}
              photoBlob={profileById(playersData[index].profileId)?.photoBlob ?? null}
              pawnStyle={playersData[index].pawnStyle}
              onBotStatusChange={(isBot) => handleBotStatusChange(index, isBot)}
              onChooseProfile={() => setPickerSeat(index)}
              onCyclePawnStyle={() => handleCyclePawnStyle(index)}
              key={index}
            />
          ))}
        </div>

        <Link
          className={styles.playBtn}
          to="/play"
          onClick={handlePlayBtnClick}
          aria-disabled={btnsDisabled}
        >
          PLAY
        </Link>
        <Link
          className={styles.loadGame}
          to="/play"
          title="Load last game"
          onClick={handleLoadLinkClick}
          aria-disabled={btnsDisabled}
        >
          or, load last game
        </Link>
        <small className={styles.version}>v{__LIBRELUDO_VERSION__}</small>
      </main>
      <Link to="/" className={styles.goToHome}>
        <HomeIcon />
      </Link>
      <ToastContainer position="top-center" />
      <Tooltip
        id="bot-status-tooltip"
        className="tooltip"
        openEvents={{ focus: false, mouseover: true }}
        place="bottom-start"
      />
      {pickerSeat !== null && (
        <ProfilePicker
          profiles={profiles}
          takenProfileIds={takenProfileIds}
          currentProfileId={playersData[pickerSeat].profileId}
          onSelect={(profile) => handleSelectProfile(pickerSeat, profile)}
          onClose={() => setPickerSeat(null)}
        />
      )}
    </div>
  );
}

export const meta: MetaFunction = () => [{ title: 'Family Ludo - Player Setup' }];
