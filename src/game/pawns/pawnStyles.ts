import type { TPawnStyle, TPlayerColour } from '../../types';

import pawnBlue from '../../assets/theme/pawn-blue.png';
import pawnRed from '../../assets/theme/pawn-red.png';
import pawnGreen from '../../assets/theme/pawn-green.png';
import pawnYellow from '../../assets/theme/pawn-yellow.png';
import agentBlue from '../../assets/theme/agent-blue.png';
import agentRed from '../../assets/theme/agent-red.png';
import agentGreen from '../../assets/theme/agent-green.png';
import agentYellow from '../../assets/theme/agent-yellow.png';
import coneBlue from '../../assets/theme/cone-blue.png';
import coneRed from '../../assets/theme/cone-red.png';
import coneGreen from '../../assets/theme/cone-green.png';
import coneYellow from '../../assets/theme/cone-yellow.png';

// Selection order used by the setup picker; 'jelly' is the default.
export const PAWN_STYLES: TPawnStyle[] = ['jelly', 'agent', 'cone'];

export const PAWN_STYLE_LABELS: Record<TPawnStyle, string> = {
  jelly: 'Jelly',
  agent: 'Agent',
  cone: 'Cone',
};

export const PAWN_IMAGE: Record<TPawnStyle, Record<TPlayerColour, string>> = {
  jelly: { blue: pawnBlue, red: pawnRed, green: pawnGreen, yellow: pawnYellow },
  agent: { blue: agentBlue, red: agentRed, green: agentGreen, yellow: agentYellow },
  cone: { blue: coneBlue, red: coneRed, green: coneGreen, yellow: coneYellow },
};

/** Resolves a player's pawn image, defaulting to jelly for older saves. */
export function getPawnImage(style: TPawnStyle | undefined, colour: TPlayerColour): string {
  return PAWN_IMAGE[style ?? 'jelly'][colour];
}
