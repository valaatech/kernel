// @flow
import React from "react";
import PropTypes from "prop-types";

import UIComponent from "~/inspire/ui/UIComponent";

import { invariantifyArray } from "~/tools/invariantify";

export default class ForEach extends UIComponent {
  static propTypes = {
    ...UIComponent.propTypes,
    RootElement: PropTypes.any,
    rootProps: PropTypes.object,
    EntryUIComponent: PropTypes.any,
    entryProps: PropTypes.object,
    entryKeys: PropTypes.object,
  }

  bindSubscriptions (focus: any, props: Object) {
    super.bindSubscriptions(focus, props);
    invariantifyArray(focus, "ForEach.focus", {
      allowUndefined: true, allowNull: true,
    });
  }

  renderLoaded (focus: any) {
    const renderedChildren = this.renderFocusAsSequence(
        focus,
        this.props.EntryUIComponent,
        this.props.entryProps,
        this.props.entryKeys && ((entry, index) => (this.props.entryKeys[index] || "")));
    if (!this.props.RootElement && !this.props.rootProps) return renderedChildren;
    return this.renderLens(
        React.createElement(
            this.props.RootElement || "div", this.props.rootProps || {}, ...renderedChildren),
        focus,
        "customForEachRoot",
    );
  }
}
