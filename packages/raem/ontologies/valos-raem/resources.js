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
valospace triple graphs or which can are accessible inside valospace
from valospace resources. The instances of this class are called
'valospace fields'. All valospace fields have valos-raem:Type or one of
its sub-classes as their rdf:domain.`,
  },
  ExpressedField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
    "rdfs:comment":
`The class of valospace fields which have a full triple expression in
all regular query and graph contexts (as opposed to fields with
non-triple semantics or triple expression only in limited contexts).`
  },
  expressor: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:ExpressedField",
    "rdfs:range": "rdfs:List",
    "rdfs:comment":
`The custom expressor of an ExpressedField as a vpath. If defined and
whenever a triple expression for this field is required the expressor
vpath is valked with scope values:
- valos-raem:0 being the field owner,
- valos-raem:1 being the field id, and
- valos-raem:2 being the possible field raw triple object value if it
  exists, otherwise undefined.
The resulting valk value is used as the object of a new triple, with
field owner and field id used as the subject and predicate.`,
  },
  EventLoggedField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:ExpressedField",
    "rdfs:comment":
`The class of valospace fields which have both a triple state
expression inside valospace and a change impression in event logs;
these are the primary, persisted sources of truth.`
  },
  impressor: {
    "@type": "valos-kernel:Property",
    "rdfs:domain": "valos-raem:EventLoggedField",
    "rdfs:range": "rdfs:List",
    "rdfs:comment":
`The custom impressor of an EventLoggedField as a vpath. Whenever an
event log entry is required for an update that targets this field the
impressor vpath is valked with scope values:
- valos-raem:0 as the field owner,
- valos-raem:1 as the field id,
- valos-raem:2 as the possible current field raw triple object value or
  undefined otherwise, and
- valos-raem:3 the new value being updated to this field.`,
  },
  CoupledField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:ExpressedField",
    "rdfs:comment":
`The class of valospace fields which have triple expression inside
valospace via coupled fields but no event log impression.`
  },
  GeneratedField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:ExpressedField",
    "rdfs:comment":
`The class of inferred fields where a field is not associated with
raw valospace triples but the triples are fully generated by the
expressor, with scope values:
- valos-raem:0 as the field owner,
- valos-raem:1 as the field id, and
- valos-raem:2 as undefined.`,
  },
  TransientField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
    "rdfs:comment":
`The class of valospace fields with no general triple expression but
with custom semantics for specific queries.`,
  },
  AliasField: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:Field",
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
  VPathRule: {
    "@type": "valos-kernel:Class",
    "rdfs:subClassOf": ["rdfs:Literal", "rdfs:List"],
    "revdoc:brief": "VPath 'vrid' literal datatype",
    "rdfs:comment":
`The class of all resources representing some VPath rule or
pseudo-rule. 'vrid'.
If this class is used as literal datatype URI the literal contains the
flat string VPath rule representation. Otherwise when this class is
the range of a property which is used as a predicate in a triple, and
the object of the triple is not a literal, then the object contains
the expanded representation of the VPath rule value as an rdf List.`
  },
  VPath: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:VPathRule",
    "revdoc:brief": "VPath rule 'vpath' datatype",
    "rdfs:comment":
`The class of all resources representing the VPath rule 'vpath' (always
begins with '@')`,
  },
  VRId: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:VPathRule",
    "revdoc:brief": "VPath rule 'vrid' datatype",
    "rdfs:comment":
`The class of all resources representing the VPath pseudo-rule
'vrid' (always begins with '@')`,
  },
  Verbs: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:VPathRule",
    "revdoc:brief": "VPath rule 'verbs' datatype",
    "rdfs:comment":
`The class of all resources representing the VPath pseudo-rule
'verbs' (always begins with '@').`,
  },
  VGRId: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:VPathRule",
    "revdoc:brief": "VPath rule 'vgrid' datatype",
    "rdfs:comment":
`The class of all resources representing the VPath rule 'vgrid' (always
begins with '$').`,
  },
  VParam: { "@type": "valos-kernel:Class",
    "rdfs:subClassOf": "valos-raem:VPathRule",
    "revdoc:brief": "VPath rule 'vparam' datatype",
    "rdfs:comment":
`The class of all resources representing the VPath pseudo-rule
'vparam' (always begins with '$' or ':').`,
  },
};
