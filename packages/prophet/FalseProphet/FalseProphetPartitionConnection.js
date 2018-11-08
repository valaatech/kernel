// @flow

import { EventBase } from "~/raem/command";

import PartitionConnection from "~/prophet/api/PartitionConnection";
import { NarrateOptions, ChronicleOptions, ChronicleRequest } from "~/prophet/api/types";

import { dumpObject } from "~/tools";

import { Prophecy, _revisePurgedProphecy } from "./_prophecyOps";
import { _confirmCommands, _purgeDispatchAndReviseEvents } from "./_storyOps";

/**
 * @export
 * @class FalseProphetPartitionConnection
 * @extends {PartitionConnection}
 */
export default class FalseProphetPartitionConnection extends PartitionConnection {
  // _headEventId is the eventId of the first unconfirmed truth.
  // penndingTruths and unconfirmedCommands are based on this, ie.
  // their 0th entry eventId is always equal to this.
  _headEventId: number = 0;
  // Discontinuous, unreduced truths. If defined, the first entry is
  // always immediately reduced. This means that first entry is always
  // undefined.
  _pendingTruths: EventBase[] = [];
  // Continuous, reduced but unconfirmed commands. Whenever
  // _pendingTruths contains a truth at an equivalent position with
  // equivalent commandId, then all commands with eventId equal or less
  // to that are confirmed as truths and transferred to _pendingTruths.
  _unconfirmedCommands: EventBase[] = [];
  _firstUnconfirmedEventId = 0;
  _isFrozen: ?boolean;

  getStatus () {
    return {
      truths: this._headEventId,
      commands: this._unconfirmedCommands.length,
      frozen: this.isFrozenConnection(),
      ...super.getStatus(),
    };
  }

  setIsFrozen (value: boolean = true) { this._isFrozen = value; }

  isFrozenConnection (): boolean { return !!this._isFrozen; }

  narrateEventLog (options: NarrateOptions = {}): Promise<Object> {
    options.receiveTruths = this.getReceiveTruths(options.receiveTruths);
    options.receiveCommands = this.getReceiveCommands(options.receiveCommands);
    return super.narrateEventLog(options);
  }

  chronicleEvents (events: EventBase[], options: ChronicleOptions = {}): ChronicleRequest {
    if (!events || !events.length) return { eventResults: events };
    try {
      if (options.isProphecy) {
        // console.log("assigning ids:", this.getName(), this._headEventId,
        //     this._unconfirmedCommands.length, "\n\tevents:", ...dumpObject(eventLog));
        for (const event of events) {
          event.eventId = this._headEventId + this._unconfirmedCommands.length;
          this._unconfirmedCommands.push(event);
        }
        this._checkForFreezeAndNotify();
      } else if (typeof events[0].eventId !== "number") {
        throw new Error("Can't chronicle events without eventId (options.isProphecy is not set)");
      }
      options.receiveTruths = this.getReceiveTruths(options.receiveTruths);
      options.receiveCommands = options.isProphecy ? null
          : this.getReceiveCommands(options.receiveCommands);
      return this._upstreamConnection.chronicleEvents(events, options);
    } catch (error) {
      throw this.wrapErrorEvent(error, `chronicleEvents(${events.length} events: [${
              events[0].eventId}, ${events[events.length - 1].eventId}])`,
          "\n\toptions:", ...dumpObject(options));
    }
  }

  receiveTruths (truths: EventBase[]) {
    try {
      this._insertEventsToQueue(truths, this._pendingTruths, false,
          (truth, queueIndex, existingTruth) => {
            this.errorEvent(`receiveTruths commandId mismatch to existing truth, expected '${
                existingTruth.commandId}', overwriting with incoming truth with commandId: '${
                truth.commandId}'`);
          });
      let purgedCommands;
      let confirms = 0;
      for (; this._pendingTruths[confirms] && this._unconfirmedCommands[confirms]; ++confirms) {
        if (this._pendingTruths[confirms].commandId !==
            this._unconfirmedCommands[confirms].commandId) {
          purgedCommands = this._unconfirmedCommands.slice(confirms);
          this._unconfirmedCommands = [];
          break;
        }
      }
      let confirmedCommands;
      if (confirms) {
        confirmedCommands = this._pendingTruths.splice(0, confirms);
        if (!purgedCommands) this._unconfirmedCommands.splice(0, confirms);
      }
      let newTruthCount = 0;
      while (this._pendingTruths[newTruthCount]) ++newTruthCount;
      this._headEventId += confirms + newTruthCount;
      if (confirmedCommands) _confirmCommands(this, confirmedCommands);
      const newTruths = this._pendingTruths.splice(0, newTruthCount);
      _purgeDispatchAndReviseEvents(this, purgedCommands, newTruths, "receiveTruth");
      return truths;
    } catch (error) {
      throw this.wrapErrorEvent(error, `receiveTruths([${truths[0].eventId}, ${
              truths[truths.length - 1].eventId}])`,
          "\n\treceived truths:", ...dumpObject(truths),
          "\n\tpendingTruths:", ...dumpObject([...this._pendingTruths]),
          "\n\tunconfirmedCommands:", ...dumpObject([...this._unconfirmedCommands]),
          "\n\tthis:", ...dumpObject(this)
      );
    }
  }

  receiveCommands (commands: EventBase[]) {
    // This is not called by chronicle, but either by command recall on
    // startup or to update conflicting command read from another tab.
    let purgedCommands;
    try {
      const newCommands = this._insertEventsToQueue(commands, this._unconfirmedCommands, true,
          (command, queueIndex) => {
            purgedCommands = this._unconfirmedCommands.splice(queueIndex);
          });
      _purgeDispatchAndReviseEvents(this, purgedCommands, newCommands, "receiveCommand");
      return commands;
    } catch (error) {
      throw this.wrapErrorEvent(error, `receiveCommand([${commands[0].eventId}, ${
              commands[commands.length - 1].eventId}])`,
          "\n\treceived commands:", ...dumpObject(commands),
          "\n\tpendingTruths:", ...dumpObject([...this._pendingTruths]),
          "\n\tunconfirmedCommands:", ...dumpObject([...this._unconfirmedCommands]),
          "\n\tthis:", ...dumpObject(this)
      );
    }
  }

  _insertEventsToQueue (events: EventBase[], targetQueue: EventBase[], isCommand: boolean,
      onMismatch: Function) {
    for (let index = 0; index !== events.length; ++index) {
      const event = events[index];
      const queueIndex = !event ? -1 : (event.eventId - this._headEventId);
      try {
        if (queueIndex < 0) continue;
        if (isCommand && queueIndex && !targetQueue[queueIndex - 1]) {
          // TODO(iridian): non-continuousity support can be added in principle.
          // But maybe it makes sense to put this functionality to scribe? Or to Oracle?
          throw new Error(`Non-continuous eventId ${event.eventId
              } detected when inserting commands to queue`);
        }
        const existingEvent = targetQueue[queueIndex];
        if (existingEvent) {
          if (event.commandId === existingEvent.commandId) continue;
          onMismatch(event, queueIndex, existingEvent);
        }
        if (isCommand) {
          const newCommands = events.slice(index);
          targetQueue.push(...newCommands);
          return newCommands;
        }
        targetQueue[queueIndex] = event;
      } catch (error) {
        throw this.wrapErrorEvent(error, isCommand
                ? `_insertUnconfirmedCommandsToQueue().events[${index}]`
                : `_insertPendingTruthsToQueue().events[${index}]`,
            "\n\tevents:", ...dumpObject(events),
            "\n\tevents[${index}]:", ...dumpObject(events[index]),
            "\n\ttargetQueue:", ...dumpObject(targetQueue),
            "\n\tqueueIndex:", queueIndex,
            "\n\tthis:", ...dumpObject(this));
      }
    }
    return undefined;
  }

  _revisePurgedProphecy (purged: Prophecy, newProphecy: Prophecy) {
    try {
      return _revisePurgedProphecy(this, purged, newProphecy);
    } catch (error) {
      throw this.wrapErrorEvent(error,
          new Error(`_revisePurgedProphecy(${purged.commandId} -> ${newProphecy.commandId})`),
          "\n\tpurged prophecy:", ...dumpObject(purged),
          "\n\tnew prophecy:", ...dumpObject(newProphecy));
    }
  }

  _checkForFreezeAndNotify (lastEvent: EventBase[]
      = this._unconfirmedCommands[(this._unconfirmedCommands.length || 1) - 1]) {
    if (lastEvent) this.setIsFrozen(lastEvent.type === "FROZEN");
    this._prophet.setConnectionCommandCount(
        this.getPartitionURI().toString(), this._unconfirmedCommands.length);
  }
}

/*
async function _confirmOrPurgeQueuedCommands (connection: ScribePartitionConnection,
    lastNewEvent: EventBase) {
  let purgedStories;
  const { eventIdBegin: beginCommandId, eventIdEnd: endCommandId, commandIds }
      = connection._commandQueueInfo;
  if ((beginCommandId <= lastNewEvent.eventId) && (lastNewEvent.eventId < endCommandId)
      && (lastNewEvent.commandId !== commandIds[lastNewEvent.eventId - beginCommandId])) {
    // connection.warnEvent("\n\tPURGING by", event.commandId, eventId, event, commandIds,
    //    "\n\tcommandIds:", beginCommandId, endCommandId, commandIds);
    // Frankly, we could just store the commands in the 'commandIds' fully.
    purgedStories = await connection._readCommands(
        { eventIdBegin: beginCommandId, eventIdEnd: endCommandId });
  }

  const newCommandQueueFirstEventId = (purgedStories ? endCommandId : lastNewEvent.eventId) + 1;
  if (connection.getFirstCommandEventId() < newCommandQueueFirstEventId) {
    _setCommandQueueFirstEventId(connection, newCommandQueueFirstEventId);
  }

  // Delete commands after event is stored, so we get no gaps.
  // TODO(iridian): Put these to the same transaction with the writeEvent
  if (connection.isLocallyPersisted()) {
    if (purgedStories) {
      // TODO(iridian): Add merge-conflict-persistence. As it stands now, for the duration of
      // the merge process the purged commands are not persisted anywhere and could be lost.
      connection._deleteCommands(beginCommandId, endCommandId);
    } else if (lastNewEvent.eventId >= beginCommandId) {
      connection._deleteCommands(beginCommandId, Math.min(lastNewEvent.eventId + 1, endCommandId));
    }
  }
  return purgedStories;
}
*/