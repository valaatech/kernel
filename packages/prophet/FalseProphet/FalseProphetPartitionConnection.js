// @flow

import { EventBase } from "~/raem/events";
import type { Story } from "~/raem/redux/Bard";
import ValaaReference from "~/raem/ValaaReference";
import type { VRef } from "~/raem/ValaaReference"; // eslint-disable-line no-duplicate-imports

import PartitionConnection from "~/prophet/api/PartitionConnection";
import { ChronicleOptions, ChronicleRequest, ChronicleEventResult } from "~/prophet/api/types";
import { initializeAspects, obtainAspect, tryAspect } from "~/prophet/tools/EventAspects";
import EVENT_VERSION from "~/prophet/tools/EVENT_VERSION";

import { dumpObject, mapEagerly, thenChainEagerly } from "~/tools";

import { Prophecy, _reviewPurgedProphecy, _reviseSchism } from "./_prophecyOps";
import { _confirmCommands, _purgeAndRecomposeStories } from "./_storyOps";

/**
 * @export
 * @class FalseProphetPartitionConnection
 * @extends {PartitionConnection}
 */
export default class FalseProphetPartitionConnection extends PartitionConnection {
  // _headEventId is the aspects.log.index of the first unconfirmed truth.
  // penndingTruths and unconfirmedCommands are based on this, ie.
  // their 0th entry aspects.log.index is always equal to this.
  _headEventId: number = 0;
  // Discontinuous, unreduced truths. If defined, the first entry is
  // always immediately reduced. This means that first entry is always
  // undefined.
  _pendingTruths: EventBase[] = [];
  // Continuous, reduced but unconfirmed commands. Whenever
  // _pendingTruths contains a truth at an equivalent position with
  // equivalent aspects.command.id, then all commands with
  // aspects.log.index equal or less to that are confirmed as truths
  // and transferred to _pendingTruths.
  _unconfirmedCommands: EventBase[] = [];
  _firstUnconfirmedEventId = 0;
  _isFrozen: ?boolean;
  _referencePrototype: VRef;

  constructor (options) {
    super(options);
    const existingRef = this._prophet._inactivePartitionVRefPrototypes[String(this._partitionURI)];
    if (existingRef) {
      this._referencePrototype = existingRef;
      delete this._prophet._inactivePartitionVRefPrototypes[String(this._partitionURI)];
    } else {
      this._referencePrototype = new ValaaReference()
          .initResolverComponent({ inactive: true, partition: this._partitionURI });
    }
  }

  _doConnect (...rest: any[]) {
    return thenChainEagerly(super._doConnect(...rest),
        ret => {
          this._referencePrototype.setInactive(false);
          return ret;
        });
  }

  isLocallyPersisted () {
    return this._isLocallyPersisted !== undefined ? this._isLocallyPersisted
        : (this._isLocallyPersisted = this._upstreamConnection.isLocallyPersisted());
  }
  isPrimaryAuthority () {
    return this._isPrimaryAuthority !== undefined ? this._isPrimaryAuthority
        : (this._isPrimaryAuthority = this._upstreamConnection.isPrimaryAuthority());
  }
  isRemoteAuthority () {
    return this._isRemoteAuthority !== undefined ? this._isRemoteAuthority
        : (this._isRemoteAuthority = this._upstreamConnection.isRemoteAuthority());
  }
  getEventVersion () {
    return this._eventVersion !== undefined ? this._eventVersion
        : (this._eventVersion = this._upstreamConnection.getEventVersion());
  }

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

  chronicleEvents (events: EventBase[], options: ChronicleOptions = {}): ChronicleRequest {
    if (!events || !events.length) return { eventResults: events };
    const connection = this;
    try {
      if (options.isProphecy) {
        // console.log("assigning ids:", this.getName(), this._headEventId,
        //     this._unconfirmedCommands.length, "\n\tevents:", ...dumpObject(events));
        for (const event of events) {
          if (!event.aspects || !event.aspects.version) {
            initializeAspects(event, { version: EVENT_VERSION });
          }
          obtainAspect(event, "log").index = this._headEventId + this._unconfirmedCommands.length;
          this._unconfirmedCommands.push(event);
        }
        this._checkForFreezeAndNotify();
      } else if (typeof events[0].aspects.log.index !== "number") {
        throw new Error(`Can't chronicle events without aspects.log.index ${
            ""}(while options.isProphecy is not set)`);
      }

      const receiveTruths = !options.isTruth && this.getReceiveTruths(options.receiveTruths);
      if (receiveTruths) options.receiveTruths = receiveTruths;
      options.receiveCommands = options.isProphecy ? null
          : this.getReceiveCommands(options.receiveCommands);
      const chronicling = this._upstreamConnection.chronicleEvents(events, options);

      const resultBase = new ChronicleEventResult(null, {
        _events: events,
        onError: errorOnFalseProphetChronicleEvents.bind(this, new Error("chronicleResultBase")),
      });
      const primaryRecital = this._prophet._primaryRecital;
      let leadingTruths;
      let upstreamEventResults;
      resultBase._forwardResults = chronicling.eventResults;
      resultBase._truthForwardResults = thenChainEagerly(chronicling.eventResults, [
        eventResults => mapEagerly((upstreamEventResults = (eventResults || events)),
            result => result.getTruthEvent(),
            (error, head, index, confirmedTruths, entries, callback, onRejected) => {
              if (!leadingTruths) leadingTruths = confirmedTruths.slice(0, index);
              const purgedStory = primaryRecital.getStoryBy(events[index].aspects.command.id);
              if (purgedStory && !error.isCommandReviseable) {
                purgedStory.schismDescription = `chronicleEvents rejection: ${error.message}`;
                purgedStory.chronicleErrorSchism = error;
                purgedStory.schismPartition = this.getPartitionURI();
              }
              // Process the remaining entries so that fully
              // rejected commands will not be needlessly revised
              return mapEagerly(entries, callback, onRejected, index + 1, confirmedTruths);
            },
        ),
        resultEvents => receiveTruths && receiveTruths(leadingTruths || resultEvents,
            undefined, undefined, leadingTruths && events[leadingTruths.length]),
        () => (resultBase._forwardResults = upstreamEventResults),
      ], errorOnFalseProphetChronicleEvents.bind(this, new Error("chronicleUpstream")));
      return {
        eventResults: events.map((event, index) => {
          const ret = Object.create(resultBase); ret.event = event; ret.index = index; return ret;
        }),
      };
    } catch (error) { return errorOnFalseProphetChronicleEvents.call(this, new Error(""), error); }
    function errorOnFalseProphetChronicleEvents (wrap, error) {
      const wrap_ = new Error(`chronicleEvents(${events.length} events).${wrap.message}`);
      wrap_.stack = wrap.stack;
      throw connection.wrapErrorEvent(error, wrap_,
          "\n\toptions:", ...dumpObject(options),
          "\n\tevents:", tryAspect(events[0], "log").index,
              tryAspect(events[events.length - 1], "log").index);
    }
  }

  receiveTruths (truths: EventBase[], unused1, unused2, rejectedCommand: EventBase) {
    try {
      this._insertEventsToQueue(truths, this._pendingTruths, false,
          (truth, queueIndex, existingTruth) => {
            this.errorEvent(
                `receiveTruths aspects.command.id mismatch with existing truth, expected '${
                existingTruth.aspects.command.id}', got incoming truth with: '${
                truth.aspects.command.id}'`,
                "\n\tresolution: overwriting with incoming truth");
          });
      let purgedCommands;
      let confirms = 0;
      for (; this._unconfirmedCommands[confirms] && this._pendingTruths[confirms]; ++confirms) {
        if (this._pendingTruths[confirms].aspects.command.id !==
            this._unconfirmedCommands[confirms].aspects.command.id) {
          purgedCommands = this._unconfirmedCommands.slice(confirms);
          this._unconfirmedCommands = [];
          break;
        }
      }
      let confirmedCommands;
      if (confirms) {
        confirmedCommands = this._pendingTruths.splice(0, confirms);
        if (!purgedCommands) this._unconfirmedCommands.splice(0, confirms);
        // purge clears all unconfirmed commands
      }
      if (!purgedCommands && rejectedCommand
          && (rejectedCommand === this._unconfirmedCommands[0])) {
        purgedCommands = this._unconfirmedCommands;
        this._unconfirmedCommands = [];
      }
      let newTruthCount = 0;
      while (this._pendingTruths[newTruthCount]) ++newTruthCount;
      this._headEventId += confirms + newTruthCount;
      if (confirmedCommands) _confirmCommands(this, confirmedCommands);
      const newTruths = this._pendingTruths.splice(0, newTruthCount);
      /*
      this.logEvent(1, () => ["receiveTruths.confirm&purge",
        "\n\tconfirmedCommands:", ...dumpObject(confirmedCommands),
        "\n\tpurgedCommands:", ...dumpObject(purgedCommands),
        "\n\tnewTruths:", ...dumpObject(newTruths)
      ]);
      */
      _purgeAndRecomposeStories(this, purgedCommands, newTruths, "receiveTruth");
      return truths;
    } catch (error) {
      throw this.wrapErrorEvent(error, `receiveTruths([${
              tryAspect(truths[0], "log").index}, ${
              tryAspect(truths[(truths.length || 1) - 1], "log").index}])`,
          "\n\treceived truths:", ...dumpObject(truths),
          "\n\tpendingTruths:", ...dumpObject([...this._pendingTruths]),
          "\n\tunconfirmedCommands:", ...dumpObject([...this._unconfirmedCommands]),
          "\n\tthis:", ...dumpObject(this)
      );
    }
  }

  receiveCommands (commands: EventBase[]) {
    // This is not called by chronicle, but either by command recall on
    // startup or to update a conflicting command read from another tab.
    let purgedCommands;
    try {
      const newCommands = this._insertEventsToQueue(commands, this._unconfirmedCommands, true,
          (command, queueIndex) => {
            purgedCommands = this._unconfirmedCommands.splice(queueIndex);
          });
      _purgeAndRecomposeStories(this, purgedCommands, newCommands || [], "receiveCommand");
      return commands;
    } catch (error) {
      throw this.wrapErrorEvent(error, `receiveCommand([${
              tryAspect(commands[0], "log").index}, ${
              tryAspect(commands[(commands.length || 1) - 1], "log").index}])`,
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
      const queueIndex = !event ? -1 : (event.aspects.log.index - this._headEventId);
      try {
        if (queueIndex < 0) continue;
        if (isCommand && queueIndex && !targetQueue[queueIndex - 1]) {
          // TODO(iridian): non-continuousity support can be added in principle.
          // But maybe it makes sense to put this functionality to scribe? Or to Oracle?
          throw new Error(`Non-continuous aspects.log.index ${event.aspects.log.index
              } detected when inserting commands to queue`);
        }
        const existingEvent = targetQueue[queueIndex];
        if (existingEvent) {
          if (event.aspects.command.id === existingEvent.aspects.command.id) continue;
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
            `\n\tevents[${index}]:`, ...dumpObject(events[index]),
            "\n\ttargetQueue:", ...dumpObject(targetQueue),
            "\n\tqueueIndex:", queueIndex,
            "\n\tthis:", ...dumpObject(this));
      }
    }
    return undefined;
  }

  _checkForFreezeAndNotify (lastEvent: EventBase[] =
      this._unconfirmedCommands[(this._unconfirmedCommands.length || 1) - 1]) {
    if (lastEvent) this.setIsFrozen(lastEvent.type === "FROZEN");
    this._prophet.setConnectionCommandCount(
        this.getPartitionURI().toString(), this._unconfirmedCommands.length);
  }

  _reviewPurgedProphecy (purged: Prophecy, newProphecy: Prophecy) {
    try {
      return _reviewPurgedProphecy(this, purged, newProphecy);
    } catch (error) {
      throw this.wrapErrorEvent(error,
          new Error(`_reviewPurgedProphecy(${tryAspect(purged, "command").id} -> ${
              tryAspect(newProphecy, "command").id})`),
          "\n\tpurged prophecy:", ...dumpObject(purged),
          "\n\tnew prophecy:", ...dumpObject(newProphecy));
    }
  }

  _reviseSchism (schism: Prophecy, purgedStories: Story[], newEvents: EventBase[]) {
    try {
      return _reviseSchism(this, schism, purgedStories, newEvents);
    } catch (error) {
      throw this.wrapErrorEvent(error,
          new Error(`_reviseSchism(${tryAspect(schism, "command").id})`),
          "\n\tschism:", ...dumpObject(schism),
          "\n\tpurged stories:", ...dumpObject(purgedStories),
          "\n\tnew events:", ...dumpObject(newEvents));
    }
  }
}
