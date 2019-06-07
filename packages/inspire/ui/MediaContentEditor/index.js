// @flow
import UIComponent from "~/inspire/ui/UIComponent";
import Presentable from "~/inspire/ui/Presentable";
import type { LiveUpdate } from "~/engine/Vrapper";
import VALEK from "~/engine/VALEK";

import { dumpObject, thenChainEagerly, wrapError } from "~/tools";

const toTextPlainInterpretation =
    VALEK.if(VALEK.toMediaContentField(), { then: VALEK.interpretContent({ mime: "text/plain" }) });

export default @Presentable(require("./presentation").default, "MediaContentEditor")
class MediaContentEditor extends UIComponent {
  bindFocusSubscriptions (focus: any, props: Object) {
    super.bindFocusSubscriptions(focus, props);
    return thenChainEagerly(null, [
      this.bindLiveKuery.bind(this, `FileEditor_content`,
          focus, toTextPlainInterpretation,
          { asRepeathenable: true, scope: this.getUIContext() }),
      this.onContentUpdate,
    ], function errorOnMediaContentEditorSubscriptions (error) {
      throw wrapError(error,
          new Error(`During ${this.debugId()
              }\n .bindFocusSubscriptions.FileEditor_content(), with:`),
          "\n\tfocus:", ...dumpObject(focus),
          "\n\tprops:", ...dumpObject(props),
          "\n\tmediaEditor:", ...dumpObject(this));
    }.bind(this));
  }

  onContentUpdate = async (liveUpdate: LiveUpdate) => {
    this.setState({ content: await liveUpdate.value() });
  }
}
