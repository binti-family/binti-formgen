"use client";
import { range } from "ramda";
import { useState } from "react";
import { useForm } from "react-hook-form";
import tagger from "./tagger";
import createMutationTemplate from "./templates/createMutationTemplate";
import updateMutationTemplate from "./templates/updateMutationTemplate";
import graphqlTypeTemplate from "./templates/graphqlTypeTemplate";
import reactFormComponentTemplate from "./templates/reactFormComponentTemplate";
import reactCreateGraphqlWrapperTemplate from "./templates/reactCreateGraphqlWrapperTemplate";
import reactUpdateGraphqlWrapperTemplate from "./templates/reactUpdateGraphqlWrapperTemplate";
import reactInputTextTemplate from "./templates/reactInputTextTemplate";
import graphqlFieldTemplate from "./templates/graphqlFieldTemplate";
import mutationArgumentTemplate from "./templates/mutationArgumentTemplate";
import reactInputDateTemplate from "./templates/reactInputDateTemplate";
import reactInputCheckboxTemplate from "./templates/reactInputCheckboxTemplate";

const buildArguments = (argumentCount, formData, template, separator) =>
  range(0, argumentCount)
    .map((index) =>
      tagger(
        {
          argumentName: formData[`argument${index}Name`],
          argument_name: toSnakeCase(formData[`argument${index}Name`]),
          argumentType: formData[`argument${index}Type`],
          argument_type: toSnakeCase(formData[`argument${index}Type`]),
        },
        template
      )
    )
    .join(separator);

const toSnakeCase = (s) => s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

const inputTypesToTemplates = {
  String: reactInputTextTemplate,
  "GraphQL::Types::ISO8601Date": reactInputDateTemplate,
  Boolean: reactInputCheckboxTemplate,
};

export default function Home() {
  const [createMutation, setCreateMutation] = useState("");
  const [updateMutation, setUpdateMutation] = useState("");
  const [argumentCount, setArgumentCount] = useState(1);
  const [modelType, setModelType] = useState("");
  const [reactForm, setReactForm] = useState("");
  const [reactCreateGraphqlWrapper, setReactCreateGraphqlWrapper] =
    useState("");
  const [reactUpdateGraphqlWrapper, setReactUpdateGraphqlWrapper] =
    useState("");

  const { register, handleSubmit, getValues } = useForm();

  const model_name = toSnakeCase(getValues("modelName") || "");

  const onSubmit = (formData) => {
    formData = {
      ...formData,
      ModelName:
        formData.modelName.charAt(0).toUpperCase() +
        formData.modelName.slice(1),
      model_name,
      argumentNames: range(0, argumentCount)
        .map((index) => formData[`argument${index}Name`])
        .join("\n    "),
      arguments: buildArguments(
        argumentCount,
        formData,
        mutationArgumentTemplate,
        "\n    "
      ),
      fields: buildArguments(
        argumentCount,
        formData,
        graphqlFieldTemplate,
        "\n    "
      ),
      reactInputs: range(0, argumentCount)
        .map((index) =>
          tagger(
            {
              argumentName: formData[`argument${index}Name`],
              argument_name: toSnakeCase(formData[`argument${index}Name`]),
              argumentType: formData[`argument${index}Type`],
              argument_type: toSnakeCase(formData[`argument${index}Type`]),
            },
            inputTypesToTemplates[formData[`argument${index}Type`]]
          )
        )
        .join("\n    "),
    };

    setCreateMutation(tagger(formData, createMutationTemplate).trim());
    setUpdateMutation(tagger(formData, updateMutationTemplate).trim());
    setModelType(tagger(formData, graphqlTypeTemplate).trim());
    setReactForm(tagger(formData, reactFormComponentTemplate).trim());
    setReactCreateGraphqlWrapper(
      tagger(formData, reactCreateGraphqlWrapperTemplate).trim()
    );
    setReactUpdateGraphqlWrapper(
      tagger(formData, reactUpdateGraphqlWrapperTemplate).trim()
    );
  };

  const textAreaStyle = { height: "500px", width: "700px" };

  const files = [
    {
      title: "Create Mutation Template",
      path: `app/graphql/mutations/create_${model_name}.rb`,
      contents: createMutation,
    },
    {
      title: "Update Mutation Template",
      path: `app/graphql/mutations/update_${model_name}.rb`,
      contents: updateMutation,
    },
    {
      title: "Model Type",
      path: `app/graphql/types/${model_name}.rb`,
      contents: modelType,
    },
    {
      title: "React Form",
      path: `app/javascript/components/${model_name}/${getValues(
        "modelName"
      )}Form.js`,
      contents: reactForm,
    },
    {
      title: "React GraphQL Create Wrapper",
      path: `app/javascript/components/${model_name}/Create${getValues(
        "modelName"
      )}.js`,
      contents: reactCreateGraphqlWrapper,
    },
    {
      title: "React GraphQL Update Wrapper",
      path: `app/javascript/components/${model_name}/Update${getValues(
        "modelName"
      )}.js`,
      contents: reactUpdateGraphqlWrapper,
    },
  ];

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          margin: "5px 0",
          display: "flex",
          gap: "5px",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <input
          type="text"
          placeholder="Model name"
          {...register("modelName")}
        />
        {range(0, argumentCount).map((index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Argument ${index} name`}
              {...register(`argument${index}Name`)}
            />
            <select
              {...register(`argument${index}Type`)}
              placeholder={`Argument ${index} type`}
            >
              {Object.keys(inputTypesToTemplates).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button onClick={() => setArgumentCount(argumentCount + 1)}>
          Add Argument
        </button>
        <button type="submit">Submit</button>
      </form>
      {files.map((file) => (
        <div key={file.title}>
          <div>{file.title}:</div>
          <div>path: {file.path}</div>
          <textarea style={textAreaStyle} value={file.contents} readOnly />
        </div>
      ))}
    </>
  );
}
