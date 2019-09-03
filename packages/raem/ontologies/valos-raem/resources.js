module.exports = {
  Type: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "rdfs:Class",
    "revdoc:brief": "valospace type",
    "rdfs:comment":
`The class of all valospace types. Instances of valospace types are
called valospace resources. Only valospace resources can appear as a
subject in valospace resource and event triple graphs.`,
  },
  Field: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "rdf:Property",
    "revdoc:brief": "valospace field",
    "rdfs:comment":
`The class of all resources which can appear as a predicate in
valospace triple graphs.
resource and event triple graphs o which can are accessible inside valospace from
valospace resources. The instances of
this class are called 'valospace fields'. All valospace fields have
valos-raem:Type or one of its sub-classes as their rdf:domain.`,
  },
  PrimaryField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
    "rdfs:comment":
`The class of valospace fields which are primary, persisted sources of
truth and have both a state representation inside valospace and a
change representation in event logs.`
  },
  TransientField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
    "rdfs:comment":
// TODO(iridian): Merge inference and transience together conceptually
// on the specification level, as their difference is just an
// implementation detail: transient fields have actual state in the
// corpus whereas inferred fields are programmatically generated during
// queries and mutations. But from the model perspective there should
// be no difference.
`The class of valospace fields which have primary state representations
inside valospace but which have only inferred representation in event
logs.`
  },
  InferredField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
    "rdfs:comment":
`The class of valospace fields with inference semantics which specify
how new triples with the inferred field as a predicate can be inferred
from existing triples.`
  },
  GeneratedField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:InferredField",
    "rdfs:comment":
`The class of inferred fields where a field is associated with a
'generator', a convergent procedural rule like taking an average or
retrieving the partition of a valos Resource. As convergent rules a
GeneratedField's can't have mutation semantics that could be reliably
translated back to mutations of other triples.`,
  },
  generator: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:GeneratedField",
    "rdfs:range": "rdfs:Resource",
    "rdfs:comment":
`The generator algorithm specification or identifier of
a GeneratedField.`
  },
  AliasField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:InferredField",
    "rdfs:comment":
`The class of inferred fields called alias fields where each such field
has an 'aliasOf' RDF property or valos Field. Alias fields are
mutation-inference symmetric so that triples with an alias field as
predicate are inferred from triples with aliasOf as predicate and
mutations with an alias field as predicate are translated to use
the aliasOf as predicate.`,
  },
  aliasOf: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:AliasField",
    "rdfs:range": "valos-raem:Field",
    "rdfs:comment":
`The alias target property specifies the inference source and mutation
target of an alias field.`,
  },
  isOwnerOf: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:boolean",
    "rdfs:comment":
`This field refers to a resource which is owned by the field subject
resource. If the subject resource is is destroyed or if this field
is removed then the owned resource is cascade destroyed.`,
  },
  isOwnedBy: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:boolean",
    "rdfs:comment":
`This field refers to a resource which owns the field subject resource.
If the owner is destroyed or if the coupled field (which is marked
with isOwnerOf) is removed from the owner then the subject resource
will be cascade destroyed. Removing the isOwnedBy field itself will
only orphan the subject resource.`,
  },
  coupledField: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "valosField",
    "rdfs:comment":
``,
  },
  defaultCoupledField: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:string",
    "rdfs:comment":
``,
  },
  preventsDestroy: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:boolean",
    "rdfs:comment":
`Field with this property prevent destruction of their subject
resource if the field has active couplings inside the same partition.`,
  },
  isDuplicateable: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:boolean",
    "rdfs:comment":
`If set to false this field not be visible for DUPLICATED class of
events.`,
  },
  initialValue: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "rdfs:Resource",
    "rdfs:comment":
`The implicit initial value of the resource field when the resource is
created.`,
  },
  ownDefaultValue: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "rdfs:Resource",
    "rdfs:comment":
`The value of a resource field which doesn't have an own value defined
(ie. is evaluated before prototype field lookup).`,
  },
  finalDefaultValue: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "rdfs:Resource",
    "rdfs:comment":
`The value of a resource field which doesn't have a value defined by
any resource in its prototype chain.`,
  },
  allowTransientFieldToBeSingular: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:Field",
    "rdfs:range": "xsd:boolean",
    "rdfs:comment":
`Bypass the default behavior which forces transient fields to be plural
to allow for singular fields.`,
  },
};