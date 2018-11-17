// @flow

import invariantify, {
  invariantifyArray, invariantifyNumber, invariantifyObject, invariantifyString,
} from "~/tools/invariantify";

export class Action {
  +type: string;
  local: ?Object;

  unrecognized: ?void;
}

export class ActionCollection extends Action {
  +actions: ?Action[];
}

export class EventBase extends Action {
  commandId: string;
}

export class UniversalEvent extends EventBase {
  eventId: number;
  timeStamp: ?number;
}

export default class Command extends EventEnvelope {
  type: "COMMAND";
}

export class Truth extends EventEnvelope {
  type: "TRUTH";
  chainHash: string;
}

export function validateActionBase (expectedType: string, action: Action, type: string,
    local: ?Object, unrecognized: Object) {
  invariantifyString(type, `${expectedType}.type`, { value: expectedType });
  invariantifyObject(local, `${expectedType}.local`, { allowNull: false, allowUndefined: true });
  if (Object.keys(unrecognized).length) {
    const { version, partitions, commandId, eventId, ...rest } = unrecognized; // migration code - version is being removed
    if (Object.keys(rest).length) {
      invariantify(false,
        `${expectedType} action contains unrecognized fields`,
        "\n\tunrecognized keys:", Object.keys(unrecognized),
        "\n\tunrecognized fields:", unrecognized);
    }
  }
}

export function validateActionCollectionBase (expectedType: string, action: ActionCollection,
    type, local, actions, unrecognized, validateAction: ?Function,
): ?ActionCollection {
  validateActionBase(expectedType, action, type, local, unrecognized);

  invariantifyArray(actions, `${expectedType}.actions`, {
    elementInvariant: validateAction ||
        (subAction => subAction && (typeof subAction === "object") && subAction.type),
    suffix: " of sub-action objects",
  }, "\n\taction:", action);

  return action;
}

export function validateEvent (command: EventBase) {
  const { type, version, commandId, eventId, timeStamp } = command;

  invariantifyString(version, `${type}.version`, { allowUndefined: true },
      "\n\taction:", command);
  invariantifyString(commandId, `${type}.commandId`, { allowUndefined: true },
      "\n\taction:", command);
  invariantifyNumber(eventId, `${type}.eventId`, { allowUndefined: true },
      "\n\taction:", command);
  invariantifyNumber(timeStamp, `${type}.timeStamp`, { allowUndefined: true },
      "\n\taction:", command);
}

export function validateTruth (truth: Truth) {

}
