
const {
  ontologyColumns,
  extractee: {
    em, ref, vsx, authors, pkg, filterKeysWithAnyOf, filterKeysWithNoneOf,
  },
} = require("@valos/revdoc");

const { tag } = require("@valos/inspire/Lens");

const { name, version, description } = require("../package");

const title = "Lens ontology";
const {
  Lens: { preferredPrefix, baseIRI, ontologyDescription, prefixes, vocabulary, context },
} = require("../ontologies");

module.exports = {
  "@context": {
    ...prefixes,
    ...context,
  },
  "VDoc:tags": ["ONTOLOGY"],
  "dc:title": title,
  "VRevdoc:package": name,
  "VRevdoc:version": version,
  "VRevdoc:preferredPrefix": preferredPrefix,
  "VRevdoc:baseIRI": baseIRI,

  respecConfig: {
    specStatus: "unofficial",
    shortName: "lensNamespace",
    editors: authors("iridian"),
    authors: authors("iridian"),
  },
  "chapter#abstract>0": {
    "#0": [
`This document describes how the `, pkg("@valos/inspire"), ` gateway
renders valospace user interfaces and also contains the 'Lens'
namespace API reference.

See the `, ref("'On' namespace reference", "@valos/inspire/On"), ` for
how to access the HTML5 events API from valospace.`,
    ],
  },
  "chapter#sotd>1": {
    "#0": [
`This document is part of the library workspace `, pkg("@valos/inspire"), `
(of domain `, pkg("@valos/kernel"), `) which has the description:
\`${description}\`.`,
    ],
  },
  "chapter#introduction>2;Application UI is fully defined inside valospace": {
    "#0": [
`A valos inspire application UI is written as `, ref("VSX text content", "#vsx"),
` that is stored inside `, ref("valospace medias", "V:Media"), `.
These media are in turn are referenced by `, ref(em("LENS properties"), "#lens_properties"), `
of valospace resources.

The application root resource has such a LENS property referencing the
application landing page VSX media. When this root resource is given as
an entry point to the end-user @valos/inspire gateway it will load all
necessary application valospace resources. Using these resources and
their medias the gateway presents the application user interface to the
end-user as an interactive web application.`,
    ],
  },
  "chapter#main>3;The main @valos/inspire user interface concepts": {
    "chapter#vsx>1;VSX medias declare the UI structure": {
      "#0": [
`The VSX text uses a html-like declarative syntax with two key extensions:`,
        { "numbered#0": [
[ref("Embedded live valoscript:", "Lens:valoscript"),
  vsx(`<div On:click={() => focus.msg = " world!"}>Hello{focus.msg || ""}</div>`)],
[ref("Valoscope UI component:", "Lens:valoscope"), vsx(
`<Valoscope if={app.isLoggedIn(context.identity)}
  lens={app.main}
  else={app.login}
/>`)],
        ] },
`The 'Lens' namespace vocabulary consists of terms that interface with
the @valos/inspire UI engine itself (like the `, ref(em("focus"), "Lens:focus"),
`, `, ref(em("if"), "Lens:if"), ` and `, ref(em("lens"), "Lens:lens"),
` in the above examples).

Other valospace vocabularies that communicate with other systems (such
as the `, ref([em("On:click"), " HTML5 event handler name"], "On:click"), `)
are defined by other documents.`,
      ]
    },
    "chapter#valoscope>2": {
      "dc:title": [
`Valoscope `, ref(em("focus"), "Lens:focus"), ` sees into valospace that is in `,
ref(em("lens"), "Lens:lens")
      ],
      "#0": [],
    },
    "chapter#valoscript>3;Embedded valoscript provides live UI interactions": {
      "#0": [],
    },
    "chapter#lens_properties>4;Resources render themselves with a LENS property": {
      "#0": [],
    },
  },
  "chapter#term_qualities>4;Term qualities": {
    "chapter#element_attributes>0;Element attributes": {
      "#0": [],
    },
    "chapter#context_variables>1;Context variables": {
      "#0": [],
    },
    "chapter#lens_term>2;Lenses": {
      "#0": [],
    },
  },
  "chapter#slots>7;Lens slots": {
    "#0": [
`A lens slot is any term which has a `, tag("Lens", "-tag"), ` and also
either `, tag("Attribute"), " or ", tag("Context"), ` tags. A slot can
be thought of as an internal variable which can be assigned (or `, em("slotted"),
`) some lens as a value. While lens slots can be explicitly referred to
from within lens medias by their term name, most of their actual
references are implicit ones by the inspire UI engine internals.`,
    ],
  },
  "chapter#ontology>8": {
    "dc:title": ["The ", em(preferredPrefix), " namespace of the library ", pkg(name), " ontology"],
    "data#prefixes": prefixes,
    "data#vocabulary": vocabulary,
    "data#context": context,
    "#section_ontology_abstract>0": [
      ontologyDescription || "",
    ],
    "chapter#section_prefixes>1": {
      "dc:title": [em(name), " IRI prefixes"],
      "#0": [],
      "table#>0;prefixes": ontologyColumns.prefixes,
    },
    "chapter#section_classes>2": {
      "dc:title": [em(preferredPrefix), " ", ref("valosheath classes", "@valos/engine#Class")],
      "#0": [
`This section describes valosheath classes of the 'Lens' namespace.`,
      ],
      "table#>0;vocabulary": {
        "VDoc:columns": ontologyColumns.classes,
        "VDoc:entries": filterKeysWithAnyOf("@type", "VEngine:Class", vocabulary),
      },
    },
    "chapter#section_properties>3": {
      "dc:title": [
        em(preferredPrefix), " ", ref("valosheath properties", "@valos/engine#Property"),
      ],
      "#0": [
`This section describes all valosheath properties of the 'Lens'
namespace.`,
      ],
      "table#>0;vocabulary": {
        "VDoc:columns": {
          ...ontologyColumns.properties,
          "column#06": {
            "VDoc:content": ["tags"],
            "VDoc:cell": {
              "VDoc:words": { "VDoc:selectField": "tags" },
              "VDoc:map": em("VDoc:selectValue"),
            },
          },
          "column#08": {
            "VDoc:content": [em("value")],
            "VDoc:wide": true,
            "VDoc:elidable": true,
            "VDoc:cell": { "VDoc:selectField": "value" },
          },
          "column#09": {
            "VDoc:content": [em("default value")],
            "VDoc:wide": true,
            "VDoc:elidable": true,
            "VDoc:cell": { "VDoc:selectField": "defaultValue" },
          },
        },
        "VDoc:entries": filterKeysWithAnyOf("@type", "VEngine:Property", vocabulary),
      },
    },
    "chapter#section_methods>4": {
      "dc:title": [
        em(preferredPrefix), " ", ref("valosheath methods", "VEngine:Method"),
      ],
      "#0": [
`This section describes valosheath methods introduced by the 'Lens' namespace`,
      ],
      "table#>0;vocabulary": {
        "VDoc:columns": ontologyColumns.methods,
        "VDoc:entries": filterKeysWithAnyOf("@type", "VEngine:Method", vocabulary),
      },
    },
    "chapter#section_vocabulary_other>8": {
      "dc:title": [em(preferredPrefix), " remaining vocabulary names"],
      "#0": [],
      "table#>0;vocabulary": {
        "VDoc:columns": ontologyColumns.vocabularyOther,
        "VDoc:entries": filterKeysWithNoneOf("@type", [
          "VEngine:Class", "VEngine:Property", "VEngine:Method",
        ], vocabulary),
      },
    },
  },
};
