const extendOntology = require("@valos/vdoc/extendOntology");

module.exports = extendOntology(_createRevdocVocabulary(), {
  extractionRules: {
    example: {
      range: "VRevdoc:Example", owner: "VDoc:content", body: "VDoc:content", rest: "dc:title",
      comment: "Example node",
    },
    ontology: {
      range: "VDoc:Chapter", owner: "VDoc:content", body: "VDoc:content", rest: "dc:title",
      comment: "Ontology specification chapter",
    },
  },
});

function _createRevdocVocabulary () {
  return {
    "@context": {
      VKernel: "https://valospace.org/kernel/0#",
      VDoc: "https://valospace.org/vdoc/0#",
      restriction: { "@reverse": "owl:onProperty" },
    },
    ontology: { "@type": "owl:Ontology",
      "rdfs:label": "VRevdoc",
      "rdf:about": "https://valospace.org/revdoc/0#",
      "rdfs:comment":
`VRevdoc ontology provides vocabulary and definitions which are tailored
for emitting ReSpec html output documents.`,
    },

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
    Invokation: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:Node",
      "rdfs:comment": "A command invokation document node",
    },
    Command: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VDoc:ContextPath",
      "rdfs:comment": "A command reference node",
    },
    CommandLineInteraction: { "@type": "VDoc:Class",
      "rdfs:subClassOf": "VRevdoc:Example",
      "rdfs:comment": "A command line interaction sequence document node",
    },
    preferredPrefix: { "@type": "VDoc:Property",
      "rdfs:domain": "VRevdoc:Document",
      "rdfs:range": "rdfs:Literal",
      "rdfs:comment": "The preferred prefix of an ontology document",
    },
    baseIRI: { "@type": "VDoc:Property",
      "rdfs:domain": "VRevdoc:Document",
      "rdfs:range": "rdfs:Resource",
      "rdfs:comment": "The IRI expansion of the preferred prefix of an ontology",
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
  };
}
