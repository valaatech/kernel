
module.exports = {
  prefix: "vdoc",
  base: "https://valospace.org/vdoc#",

  prefixes: {
    dc: "http://purl.org/dc/elements/1.1/",
    owl: "http://www.w3.org/2002/07/owl#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    vdoc: "https://valospace.org/vdoc#",
  },

  context: {
    a: { "@id": "rdf:type", "@type": "@id" },
    "vdoc:content": {
      "@id": "https://valospace.org/vdoc#content", "@container": "@list",
    },
    "vdoc:words": {
      "@id": "https://valospace.org/vdoc#words", "@container": "@list",
    },
    "vdoc:entries": {
      "@id": "https://valospace.org/vdoc#entries", "@container": "@list",
    },
  },

  vocabulary: {
    Node: { a: "rdfs:Class",
      "rdfs:comment": "A document tree Node",
    },
    content: { a: "rdf:Property",
      "rdfs:domain": "vdoc:Node", "rdfs:range": "rdfs:List",
      "rdfs:comment": "The primary visible content of a Node",
    },
    words: { a: "rdf:Property", "rdfs:subPropertyOf": "vdoc:content",
      "rdfs:domain": "vdoc:Node", "rdfs:range": "rdfs:List",
      "rdfs:comment": "A visible list of visually separate words",
    },
    entries: { a: "rdf:Property", "rdfs:subPropertyOf": "vdoc:content",
      "rdfs:domain": "vdoc:Node", "rdfs:range": "rdfs:List",
      "rdfs:comment": "A visible list of vertically or horizontally segmented entries",
    },
    Chapter: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A titled, possibly numbered chapter document node",
    },
    BulletList: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A bullet list document node",
    },
    NumberedList: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A numbered list document node",
    },
    Table: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A two-dimensional table document node",
    },
    Header: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A table cross-entry-section header node",
    },
    headers: { a: "rdf:Property",
      "rdfs:domain": "vdoc:Table", "rdfs:range": "rdfs:List",
      "rdfs:comment": "A list of table cross-entry-section headers",
    },
    CharacterData: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A CDATA document node",
    },
    Reference: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A reference document node",
    },
    ContextPath: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:Node",
      "rdfs:comment": "A context-based path document node",
    },
    context: { a: "rdf:Property", "rdfs:domain": "vdoc:ContextPath", "rdfs:range": "rdfs:Resource",
      "rdfs:comment": "Non-visible context base (absolute or relative to current base)",
    },
    ContextBase: { a: "rdfs:Class", "rdfs:subClassOf": "vdoc:ContextPath",
      "rdfs:comment": "A context base setting document node",
    },
  },

  extractionRules: {
    "": {
      comment: "Basic Node", owner: "vdoc:content", body: "vdoc:content",
    },
    chapter: {
      range: "vdoc:Chapter", owner: "vdoc:content", body: "vdoc:content", rest: "dc:title",
      comment: "Numbered, titled chapter",
    },
    bulleted: {
      range: "vdoc:BulletList", owner: "vdoc:content", body: "vdoc:entries",
      comment: "Bulleted list",
    },
    numbered: {
      range: "vdoc:NumberedList", owner: "vdoc:content", body: "vdoc:entries",
      comment: "Numbered list",
    },
    table: {
      range: "vdoc:Table", owner: "vdoc:content", body: "vdoc:headers", rest: "vdoc:lookup",
      comment: "Table",
    },
    header: {
      range: "vdoc:Header", owner: "vdoc:entries", body: "vdoc:content", rest: "vdoc:key",
      comment: "Header",
    },
    data: {
      range: null, owner: null, body: null,
      comment: "Hidden data",
    },
  },
};
