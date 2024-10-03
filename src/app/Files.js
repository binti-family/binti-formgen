"use client";

import tagger from "./tagger";
import graphqlCreateMutationTemplate from "./templates/graphql/createMutationTemplate";
import graphqlUpdateMutationTemplate from "./templates/graphql/updateMutationTemplate";
import graphqlDeleteMutationTemplate from "./templates/graphql/deleteMutationTemplate";
import graphqlTypeTemplate from "./templates/graphql/typeTemplate";
import reactFormComponentTemplate from "./templates/react/formComponentTemplate";
import reactGraphqlCreateWrapperTemplate from "./templates/react/graphql/createWrapperTemplate";
import reactGraphqlUpdateWrapperTemplate from "./templates/react/graphql/updateWrapperTemplate";
import reactInputTextTemplate from "./templates/react/inputTextTemplate";
import graphqlFieldTemplate from "./templates/graphql/fieldTemplate";
import mutationArgumentTemplate from "./templates/graphql/mutationArgumentTemplate";
import reactInputDateTemplate from "./templates/react/inputDateTemplate";
import reactInputCheckboxTemplate from "./templates/react/inputCheckboxTemplate";
import queryTemplate from "./templates/graphql/queryTemplate";
import PropTypes from "prop-types";
import { toCamelCase } from "./utils";
import { useState } from "react";
import { useMediaQuery } from "@uidotdev/usehooks";

const defaultSeparator = "\n    ";

const buildArguments = ({ argumentz, getTemplate }) =>
  argumentz
    .map((argument, index) =>
      tagger(
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
      [key]: tagger(formData, template).trim(),
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

const Files = ({ model_name, argumentz }) => {
  const [copied, setCopied] = useState(null);
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const handleCopy = (content, title) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(title);
      setTimeout(() => setCopied(null), 2000); // Reset after 2 seconds
    });
  };

  return (
    <>
      {generateFiles({ model_name, argumentz }).map((file) => (
        <div
          key={file.title}
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <div>{file.title}:</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>path: {file.path}</div>
            {copied === file.title && <span>Copied!</span>}
            <button onClick={() => handleCopy(file.contents, file.title)}>
              📋 Copy to Clipboard
            </button>
          </div>
          <pre
            style={{
              width: "700px",
              whiteSpace: "pre-wrap",
              backgroundColor: isDarkMode ? "#333333" : "#ffffff",
              color: isDarkMode ? "#ffffff" : "#000000",
              border: "1px solid grey",
            }}
            contentEditable
          >
            <code>{file.contents}</code>
          </pre>
        </div>
      ))}
    </>
  );
};

Files.propTypes = {
  model_name: PropTypes.string,
  argumentz: PropTypes.array,
};

export default Files;
