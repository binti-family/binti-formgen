"use client";

import graphqlCreateMutationTemplate from "../templates/graphql/mutations/create";
import graphqlUpdateMutationTemplate from "../templates/graphql/mutations/update";
import graphqlDeleteMutationTemplate from "../templates/graphql/mutations/delete";
import graphqlTypeTemplate from "../templates/graphql/type";
import reactFormComponentTemplate from "../templates/react/form";
import reactGraphqlCreateWrapperTemplate from "../templates/react/graphqlWrappers/create";
import reactGraphqlUpdateWrapperTemplate from "../templates/react/graphqlWrappers/update";
import reactInputTextTemplate from "../templates/react/inputs/text";
import graphqlFieldTemplate from "../templates/graphql/field";
import mutationArgumentTemplate from "../templates/graphql/mutations/argument";
import reactInputDateTemplate from "../templates/react/inputs/date";
import reactInputCheckboxTemplate from "../templates/react/inputs/checkbox";
import queryTemplate from "../templates/graphql/query";
import { applyTags, toCamelCase } from "../utils";

const defaultSeparator = "\n    ";

const buildArguments = ({ argumentz, getTemplate }) =>
  argumentz
    .map((argument, index) =>
      applyTags(
        {
          argumentName: toCamelCase(argument.name),
          argument_name: argument.name,
          argumentType: toCamelCase(argument.type),
        },
        getTemplate(index)
      )
    )
    .join(defaultSeparator);

const inputTypesToTemplates = {
  String: reactInputTextTemplate,
  "GraphQL::Types::ISO8601Date": reactInputDateTemplate,
  Boolean: reactInputCheckboxTemplate,
  Integer: reactInputTextTemplate,
};

const generateAliases = (formData) => {
  const model_name = formData.model_name;
  const argumentz = formData.argumentz;
  const modelName = toCamelCase(model_name || "");
  const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const argumentNames = argumentz.map((argument) => toCamelCase(argument.name));

  return {
    modelName,
    ModelName,
    model_name,
    argument_names: argumentz.map((argument) => argument.name),
    argumentNames,
    argumentNamesString: argumentNames.join(defaultSeparator),
  };
};

const populateSubTemplates = ({ argumentz }) => ({
  mutationArguments: buildArguments({
    argumentz,
    getTemplate: () => mutationArgumentTemplate,
  }),
  graphqlFields: buildArguments({
    argumentz,
    getTemplate: () => graphqlFieldTemplate,
  }),
  reactInputs: buildArguments({
    argumentz,
    getTemplate: (index) => inputTypesToTemplates[argumentz[index].type],
  }),
});

const generateFiles = (formData) => {
  formData = {
    ...formData,
    ...generateAliases(formData),
    ...populateSubTemplates(formData),
  };

  const { model_name, ModelName } = formData;

  const filledTemplates = Object.entries({
    query: queryTemplate,
    graphqlCreateMutation: graphqlCreateMutationTemplate,
    graphqlUpdateMutation: graphqlUpdateMutationTemplate,
    graphqlDeleteMutation: graphqlDeleteMutationTemplate,
    graphqlModelType: graphqlTypeTemplate,
    reactForm: reactFormComponentTemplate,
    reactGraphqlCreateWrapper: reactGraphqlCreateWrapperTemplate,
    reactGraphqlUpdateWrapper: reactGraphqlUpdateWrapperTemplate,
  }).reduce(
    (acc, [key, template]) => ({
      ...acc,
      [key]: applyTags(formData, template).trim(),
    }),
    {}
  );

  return [
    {
      title: "Query Template",
      path: `app/graphql/queries/${model_name}.rb`,
      contents: filledTemplates.query,
    },
    {
      title: "Create Mutation Template",
      path: `app/graphql/mutations/create_${model_name}.rb`,
      contents: filledTemplates.graphqlCreateMutation,
    },
    {
      title: "Update Mutation Template",
      path: `app/graphql/mutations/update_${model_name}.rb`,
      contents: filledTemplates.graphqlUpdateMutation,
    },
    {
      title: "Delete Mutation Template",
      path: `app/graphql/mutations/delete_${model_name}.rb`,
      contents: filledTemplates.graphqlDeleteMutation,
    },
    {
      title: "Model Type",
      path: `app/graphql/types/${model_name}.rb`,
      contents: filledTemplates.graphqlModelType,
    },
    {
      title: "React Form",
      path: `app/javascript/components/${model_name}/${ModelName}Form.js`,
      contents: filledTemplates.reactForm,
    },
    {
      title: "React GraphQL Create Wrapper",
      path: `app/javascript/components/${model_name}/Create${ModelName}.js`,
      contents: filledTemplates.reactGraphqlCreateWrapper,
    },
    {
      title: "React GraphQL Update Wrapper",
      path: `app/javascript/components/${model_name}/Update${ModelName}.js`,
      contents: filledTemplates.reactGraphqlUpdateWrapper,
    },
  ];
};

export default generateFiles;
