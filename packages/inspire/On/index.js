const { ref } = require("@valos/revdoc/extractee");
const { buildNamespaceSpecification } = require("@valos/tools/namespace");

module.exports = buildNamespaceSpecification({
  domain: "@valos/kernel",
  preferredPrefix: "On",
  baseIRI: "https://valospace.org/inspire/On/0#",
  namespaceModules: {
    VKernel: "@valos/kernel/VKernel",
    V: "@valos/space/V",
    VEngine: "@valos/engine/VEngine",
    Lens: "@valos/inspire/Lens",
    On: "@valos/inspire/On",
  },
  description: [
`The ValOS inspire On namespace contains event callback names used by
the inspire UI layer.`,
null,
`The namespace inherits all HTML5 event names verbatim as name suffixes
but also adds new valos-specific event callback names. Like HTML5
events these callbacks are called with a synthetic event as their first
argument.`,
  ],
  declareNames,
  processDeclaration (name, declaration, definitionDomain) {
    const labels = [];
    const componentType = tags.includes("Valoscope") ? "Lens:Valoscope"
        : tags.includes("Attribute") ? "Lens:Element"
        : null;
    if (componentType) {
      definitionDomain.push(componentType);
      labels.push([`On:${name}`, `On:${name}`]);
    }
    return labels;
  },
});

function declareNames ({ declareName }) {
  declareName("frameactive", {
    tags: ["Attribute", "Inspire", "Event"],
    type: "EventHandler",
    description:
`The ValOS frame of the element is active`,
  });

  declareName("framepropertychange", {
    tags: ["Attribute", "Inspire", "Event"],
    type: "EventHandler",
    description:
`A ValOS frame property has changed`,
  });

  declareName("focuspropertychange", {
    tags: ["Attribute", "Inspire", "Event"],
    type: "EventHandler",
    description:
`A ValOS focus property has changed`,
  });

  declareName("click", {
    tags: ["Attribute", "HTML5", "Event"],
    type: "EventHandler",
    description:
ref("The HTML5 'click' event", "https://w3c.github.io/uievents/#event-type-click"),
  });
}