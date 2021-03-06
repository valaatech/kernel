module.exports = {
  domain: "@valos/kernel",
  preferredPrefix: "VRevdoc",
  baseIRI: "https://valospace.org/revdoc/0#",
  namespaceModules: {
    VKernel: "@valos/kernel/VKernel",
    VDoc: "@valos/vdoc/VDoc",
    VRevdoc: "@valos/revdoc/VRevdoc",
  },
  description:
`'VRevdoc' namespace provides vocabulary and definitions which are
tailored for emitting ReSpec html output documents.`,
  context: {
    restriction: { "@reverse": "owl:onProperty" },
  },
  vocabulary: _createRevdocVocabulary(),
  extractionRules: {
    example: {
      range: "VRevdoc:Example", owner: "VDoc:content", body: "VDoc:content", rest: "dc:title",
      comment: "Example node",
    },
  },
};

function _createRevdocVocabulary () {
  return {
    Document: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Chapter",
      "rdfs:comment": "A ReSpec specification document",
    },
    Example: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Node",
      "rdfs:comment": "A ReSpec example node",
    },
    Definition: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Node",
      "rdfs:comment": "A ReSpec term definition document node",
    },
    Package: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Reference",
      "rdfs:comment": "A package reference document node",
    },
    ABNF: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:CharacterData",
      "rdfs:comment": "An ABNF section node",
    },
    JSONLD: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:CharacterData",
      "rdfs:comment": "An JSONLD section node",
    },
    Turtle: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:CharacterData",
      "rdfs:comment": "An Turtle section node",
    },
    VSX: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:CharacterData",
      "rdfs:comment": "An VSX section node",
    },
    Command: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:ContextPath",
      "rdfs:comment": "A single command reference node",
    },
    Invokation: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:ContextPath",
      "rdfs:comment": "A command plus its parameters document node",
    },
    CommandLineInteraction: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VRevdoc:Example",
      "rdfs:comment": "A command line interaction sequence document node",
    },
    preferredPrefix: { "@type": "VDoc:Property",
      "rdfs:domain": "VRevdoc:Document",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "The preferred prefix of an ontology namespace",
    },
    baseIRI: { "@type": "VDoc:Property",
      "rdfs:domain": "VRevdoc:Document",
      "rdfs:range": "rdfs:Resource",
      "rdfs:comment": "The base IRI of an ontology namespace",
    },
    package: { "@type": "VDoc:Property",
      "rdfs:domain": "VDoc:Node",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "A package name",
    },
    version: { "@type": "VDoc:Property",
      "rdfs:domain": "VDoc:Node",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "A semver string",
    },
    introduction: { "@type": "VDoc:Property",
      "rdfs:domain": "VDoc:Node",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "VRevdoc introduction section",
    },
    Tooltip: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Node",
      "rdfs:comment": "A hoverable tooltip document node",
    },
    tooltipContent: { "@type": "VDoc:Property",
      "rdfs:domain": "VRevdoc:Tooltip",
      "rdfs:range": "VDoc:Node",
      "rdfs:comment": "The tooltip content",
    },

    deprecatedInFavorOf: { "@type": "VDoc:Property",
      "rdfs:domain": "rdfs:Resource",
      "rdfs:range": "xsd:string",
      "rdfs:comment": `The preferred resource in favor of the subject resource.`,
    },
    indexLabel: { "@type": "VDoc:Property",
      "rdfs:domain": "rdfs:Resource",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "User-readable label for index references *to* the subject resource",
    },
  };
}
