// @flow

import { Action, validateActionBase } from "~/raem/command/Command";
import { invariantifyId } from "~/raem/ValaaReference";

export const DESTROYED = "DESTROYED";

export class Destroyed extends Action {
  type: "DESTROYED";

  id: mixed;
}

export default function destroyed (action: Action): Destroyed {
  action.type = DESTROYED;
  return validateDestroyed(action);
}

export function validateDestroyed (action: Action): Destroyed {
  const { type, local, id, ...unrecognized }: Destroyed = action;

  validateActionBase(DESTROYED, action, type, local, unrecognized);

  invariantifyId(id, "DESTROYED.id", {}, "\n\taction:", action);
  return action;
}
