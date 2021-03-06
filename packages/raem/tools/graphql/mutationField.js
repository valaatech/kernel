import commonFieldInfos from "~/raem/tools/graphql/commonFieldInfos";
import invariantify from "~/tools/invariantify";

/**
 * Field information section for a mutationInputField field, ie. a field which is provided as part
 * of a mutation operation, containing input data temporarily made part of the state.
 *
 * @export
 * @param {any} targetFieldName
 * @param {any} type
 * @param {any} description
 * @param {any} [additionalDescriptors={}]
 * @returns
 */
export default function mutationField (targetFieldName, type, description,
    additionalDescriptors = {}) {
  invariantify(type, "mutationField.type");
  const common = commonFieldInfos(targetFieldName, type, description);
  const ret = {
    [targetFieldName]: {
      ...common,
      isMutation: true,
      ...additionalDescriptors,
    },
  };
  return ret;
}
