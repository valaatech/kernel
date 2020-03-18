
const {
  extractee: {
    c, em, ref,
    authors, quote, pkg,
    filterKeysWithAnyOf, filterKeysWithNoneOf, valosRaemFieldClasses,
  },
  ontologyHeaders,
} = require("@valos/revdoc");

const {
  valos_raem: { prefix, prefixIRI, prefixes, vocabulary, context },
 } = require("./ontologies");

const { name, version, description } = require("./package");

module.exports = {
  "dc:title": description,
  "vdoc:tags": ["PRIMARY", "INTRODUCTORY", "ONTOLOGY", "LIBRARY"],
  "revdoc:package": name,
  "revdoc:prefix": prefix,
  "revdoc:prefixIRI": prefixIRI,
  "revdoc:version": version,
  respecConfig: {
    subtitle: version,
    specStatus: "unofficial",
    editors: authors("iridian"),
    authors: authors(),
    shortName: "raem",
  },
  "chapter#abstract>0": {
    "#0": [
`This library provides the definitions and reference implementation
for the fundamental `, c(`ValOS Resources`), " and ", c(`ValOS Events`), `
systems.`,
    ],
  },
  "chapter#sotd>1": {
    "#0": [
`This document is part of the library workspace `, pkg("@valos/raem"), `
(of domain `, pkg("@valos/kernel"), `) which has the description:
\`ValOS Resources And Events Model (ValOS-RAEM) API, Schema\``,
    ],
  },
  "chapter#introduction>2": {
    "#0": [
`This library provides the definitions and reference implementations
for the fundamental `, c(`ValOS Resources`), " and ", c(`ValOS Events`), `
systems.

`, quote([
  `A ValOS Resource `, c(`resource`), ` represents a well-defined part of
  the world. It has a well-defined state at each particular moment in time.`,
]), `

`, quote([
  `A ValOS Event `, c(`event`), ` represents a dynamic change to a
  resource by describing the change from previous to subsequent resource
  states at a particular time.`,
]), `

The interplay of these distinct yet interwoven systems forms the
foundation of the Valaa Open System.`,
    ],
  },
  [`chapter#readme>3;${
      ""}@valos/raem provides ValOS Resources And Events Model \`ValOS-RaEM\` (/væləsˌɹɛem/)`]: {
    "#0":
`This library provides:`,
    "bulleted#1": [
["schema definitions for ", c("Resource"), " and the other core types."],
[c("Corpus"), " component which stores in-memory representations of the resources."],
[c("reducers"), " which a corpus uses to convert (", c("reduce"),
  ") events into changes of its resource representations."],
["the kuery language ", c("VALK"), " definition and the kuery engine ",
  c("Valker"), "component for accessing and manipulating the resources."],
[c("ghost instancing"), ` mechanism which unifies the object
  oriented instantiation and inheritance principles into a single
  but powerful mechanism for ValOS resources.`],
[c("resource couplings"), ` mechanism which allows referential
  integrity and the definition of different types of reference
  semantics like ownership, global references and local references.`],
// TODO(iridian, 2019-07): Valospace and chronicles should in principle
// be inside @valos/sourcerer. This refactoring effort would be
// valuable otherwise as well as it would clarify Valker API's and
// simplify its implementation considerably.
// However that's gonna be a damn of a refactoring process to fully
// abstract and excise them from @valos/raem.
[c("urn:valos"), ` specification which defines globally unique
  identifiers for ValOS resources.`],
[c("ValOSURL"), ` specification which allows for universal locating of resources.`],
[c("valospace"), ` definition as a distributed set of resources
  containing references to each other using the VRLs.`],
[c("chronicles"), ` mechanism which allows for unlimited scalability of
  the `, c("valospace"), ` into a singular globally distributed and
  unified object space.`],
    ],
    "bulleted#2": [
["depends:", pkg(`@valos/tools`), c(`immutable`)],
["exports:", c(`Corpus`), c(`Command`), c(`VALK`), c(`Valker`), c(`RAEMContentAPI`)],
["valosheath:", c(`Resource`), c(`TransientFields`), c(`Bvob`), c(`Chronicle`)],
["concepts:", c(`ghost instancing`), c(`chronicles`), c(`couplings`)],
    ],
    "chapter#section_url_urn_id>2;ValOS URLs, urn:valos and raw id's": {
      "#0": [
`ValOS URL is used to specify a parameterized location reference to a
ValOS Resource. It has two major parts separated by the URI fragment
separator \`#\`: *chronicle URI* part and a *local reference* part.

*Chronicle URI* identifies the target authority and chronicle of
the reference. It corresponds to scheme, hierarchical and query parts
of an URI; everything but the fragment. Its precise structure and
interpretation is specified by the scheme but typically the scheme and
hierarchical part identify an authority and query part identifies
a chronicle.

*Local reference* identifies a particular resource inside a chronicle
but also contains optional *coupling*, *ghost path*, *lens* (and other)
parts which further parameterize the reference itself. It corresponds
to the URI fragment part but has sub-structure which is specified in
this document.`
      ],
      [`c#valos_iri_structure>0;${
        ""}Correlations between ValOS URL and urn:valos (top) and URI and URN (bottom)`]:
`                                            valos-url
┌────────────────────────────────────────────────┴─────────────────────────────────────────────────┐
                  chronicle-uri                                      resource-ref
┌───────────────────────┴────────────────────────┐ ┌──────────────────────┴────────────────────────┐
                         resource-url                                         ref-params
┌──────────────────────────────┴────────────────────────────────┐  ┌───────────────┴───────────────┐
         authority-uri               chronicle-id   resource-id         coupling           lens
┌──────────────┴───────────────┐    ┌─────┴──────┐ ┌─────┴──────┐  ┌───────┴────────┐ ┌─────┴──────┐

valaa-test://example.com:123/dev?id=@$~raw.a...2@@#987b-72...8263?=coupling=relations&lens=ROOT_LENS

                                                   └─────┬──────┘  └──────────────┬────────────────┘
                                                        nss                  q-component
└───┬────┘   └──────┬──────┘ └┬┘ └───────┬───────┘ └──────────────────────┬────────────────────────┘
  scheme        authority    path      query                           fragment
             └────────┬────────┘
                  hier-part
`,
      "chapter#section_dualisms>1;Curious dualisms of *chronicle URI* and *local reference*": {
        "#0":
`The division between chronicle URI and local reference has many curious
dualistic qualities: backend vs. frontend, hierarchical vs. flat,
routing vs. computation, extensible vs. fixed, absolute vs. contextual,
coarse vs. granular, self-contained vs. part-of-a-whole.`,
        "chapter#1;Chronicle URI domain is backend, local reference domain is front-end": {
          "#0":
`ValOS backends deal with the indivisible chronicles and thus don't care
about the particularities of local references to individual resources.
This corresponds to how in web architecture URI fragments are not sent
to backend with resource requests. Conversely, ValOS frontends don't
care where a resource comes from once it has been loaded, but about its
identity, relationships and the parameters of those relationships. This
is reflected in how frontend code regularily drops the chronicle URI.`,
        },
        [`chapter#2;Chronicle URI structure is specified by the scheme,${
          ""} local reference structure is specified by ValOS`]: {
          "#0":
`By the nature of its distributed event sourcing architecture ValOS
focuses heavily on the frontend. The cross-compatibility between
components is driven by how new backends can integrate and talk with
existing front-end clients. This is facilitated by front-end spindle
systems which enables new ValOS URI schemes to specify new routing
solutions and fundamentally new backend infrastructures, as long as
said infrastructures can route ValOS event streams to clients. This
corresponds to how ValOS doesn't specify how a *chronicle URI*
identifies and locates chronicles and authorities but leaves it to
the scheme specifications and their reference implementations of
frontend spindles.`,
        },
        [`chapter#3;Chronicles URI's identify self-contained wholes,${
          ""} resource references need their context`]: {
          "#0":
`Web architecture specifies that all or none of the document is
retrieved. This corresponds to the behaviour of ValOS chronicles which
are always retrieved as a whole. Chronicle URI's contain all and
nothing but the components which identify web resources, that is
everything but the fragment.`,
        },
        "chapter#4;Etc.": {
          "#0": [],
        },
      },
      "chapter#resource_id>2;resource-id": {
        "#0": [
// embed("@valos/raem/valos-resource-id#introduction"),
        ],
      },
      "chapter#vrl>3;VRL": {
        "#0": [
`Javascript class which implements ValOS reference URI and associated
operations.`,
        ],
      },
    },
  },
  "chapter#ontology>8": {
    "dc:title": [`library `, em(name), ` ontology, prefix `, em(prefix)],
    "data#prefixes": prefixes,
    "data#vocabulary": vocabulary,
    "data#context": context,
    "#section_ontology_abstract>0": [
`${name} ontology specifies the Valospace core types and properties
directly to the @valos/kernel namespace.`,
    ],
    "chapter#section_prefixes>1": {
      "dc:title": [em(name), ` IRI prefixes`],
      "#0": [],
      "table#>0;prefixes": ontologyHeaders.prefixes,
    },
    "chapter#section_classes>2": {
      "dc:title":
          [em(prefix), ` `, ref("valos_kernel:Class", "@valos/kernel#Class"), ` vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.classes,
        "vdoc:entries": filterKeysWithAnyOf("@type", "valos_kernel:Class", vocabulary),
      },
    },
    "chapter#section_properties>3": {
      "dc:title":
          [em(prefix), ` `, ref("valos_kernel:Property", "@valos/kernel#Property"), ` vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.properties,
        "vdoc:entries": filterKeysWithAnyOf("@type", "valos_kernel:Property", vocabulary),
      },
    },
    "chapter#section_types>4": {
      "dc:title": [em(prefix), ` `, ref("valos_raem:Type", "@valos/raem#Type"), ` vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.types,
        "vdoc:entries": filterKeysWithAnyOf("@type", "valos_raem:Type", vocabulary),
      },
    },
    "chapter#section_fields>5": {
      "dc:title": [em(prefix), ` `, ref("valos_raem:Field", "@valos/raem#Field"), ` vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.fields,
        "vdoc:entries": filterKeysWithAnyOf("@type", valosRaemFieldClasses, vocabulary),
      },
    },
    "chapter#section_resolvers>6": {
      "dc:title":
          [em(prefix), ` `, ref("valos_raem:Resolver", "@valos/raem#Resolver"), ` vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.verbs,
        "vdoc:entries": filterKeysWithAnyOf("@type", "valos_raem:Resolver", vocabulary),
      },
    },
    "chapter#section_vocabulary_other>8": {
      "dc:title": [em(prefix), ` remaining vocabulary`],
      "#0": [],
      "table#>0;vocabulary": {
        "vdoc:headers": ontologyHeaders.vocabularyOther,
        "vdoc:entries": filterKeysWithNoneOf("@type", [
          "valos_kernel:Class", "valos_kernel:Property",
          "valos_raem:Type", ...valosRaemFieldClasses, "valos_raem:Resolver",
        ], vocabulary),
      },
    },
    "chapter#section_context>9": {
      "dc:title": [em(prefix), ` JSON-LD context term definitions`],
      "#0": [],
      "table#>0;context": ontologyHeaders.context,
    },
  },
};
