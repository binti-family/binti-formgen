"use client";
import { range } from "ramda";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import queryTemplate from "./templates/graphql/queryTemplate";

const buildArguments = (argumentCount, formData, template, separator) =>
  range(0, argumentCount)
    .map((index) =>
      tagger(
        {
          argumentName: formData[`argument_${index}_name`],
          argument_name: toSnakeCase(formData[`argument_${index}_name`]),
          argumentType: formData[`argument${index}Type`],
          argument_type: toSnakeCase(formData[`argument${index}Type`]),
        },
        template
      )
    )
    .join(separator);

const toSnakeCase = (s) => s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
const toCamelCase = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const inputTypesToTemplates = {
  String: reactInputTextTemplate,
  "GraphQL::Types::ISO8601Date": reactInputDateTemplate,
  Boolean: reactInputCheckboxTemplate,
  Integer: reactInputTextTemplate,
};

const zip = new JSZip();

const onSubmit =
  (getValues, setFilledTemplates, argumentCount) => (formData) => {
    const model_name = getValues("model_name");
    const modelName = toCamelCase(model_name || "");
    const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const argumentz = range(0, argumentCount).map((index) => ({
      name: formData[`argument_${index}_name`],
      type: formData[`argument${index}Type`],
    }));

    const url = new URL(window.location.href);
    url.search = `modelName=${modelName}&arguments=${JSON.stringify(
      argumentz
    )}`;
    window.history.pushState({}, "", url);

    const argumentNames = range(0, argumentCount).map((index) =>
      formData[`argument_${index}_name`]
        .replace(/([a-z])_([A-Z])/g, "$1U$2")
        .toLowerCase()
    );

    formData = {
      ...formData,
      modelName,
      ModelName,
      model_name,
      argument_names: range(0, argumentCount).map(
        (index) => formData[`argument_${index}_name`]
      ),
      argumentNames,
      argumentNamesString: argumentNames.join("\n    "),
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
              argumentName: formData[`argument_${index}_name`],
              argument_name: toSnakeCase(formData[`argument_${index}_name`]),
              argumentType: formData[`argument${index}Type`],
              argument_type: toSnakeCase(formData[`argument${index}Type`]),
            },
            inputTypesToTemplates[formData[`argument${index}Type`]]
          )
        )
        .join("\n    "),
    };

    setFilledTemplates(
      Object.entries({
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
      )
    );
  };

export default function Home() {
  const queryParameters = window.location.search
    .replace("?", "")
    .split("&")
    .map((param) => param.split("="))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  const argumentz = JSON.parse(unescape(queryParameters.arguments));

  const [argumentCount, setArgumentCount] = useState(argumentz.length);
  const [filledTemplates, setFilledTemplates] = useState({});

  const defaultValues = {
    ...argumentz.reduce(
      (acc, arg, index) => ({
        ...acc,
        [`argument_${index}_name`]: arg.name,
        [`argument_${index}_type`]: arg.type,
      }),
      {}
    ),
    model_name: toSnakeCase(queryParameters.modelName || ""),
  };

  console.log(defaultValues);

  const { register, handleSubmit, getValues } = useForm({ defaultValues });

  const model_name = getValues("model_name");
  const modelName = toCamelCase(model_name || "");
  const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  const textAreaStyle = { height: "500px", width: "700px" };

  const files = [
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
      contents: filledTemplates.graphqlDeleteMutationTemplate,
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

  const generateZip = () => {
    files.forEach((file) => zip.file(file.path, file.contents));
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "binti-formgen.zip");
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(
          onSubmit(getValues, setFilledTemplates, argumentCount)
        )}
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
          placeholder="model_name"
          {...register("model_name")}
        />
        {range(0, argumentCount).map((index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`argument_${index}_name`}
              {...register(`argument_${index}_name`)}
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
        <button onClick={generateZip}> Download Zip </button>
      </form>
      <div>Line to add to app/graphql/types/query_type.rb:</div>
      <textarea
        style={{ height: "30px", width: "500px" }}
        value={`query(Queries::${ModelName})`}
      />
      <div>Lines to add to app/graphql/types/mutation_type.rb:</div>
      <textarea
        style={{ height: "50px", width: "700px" }}
        value={`field(:create_${model_name}, mutation: Mutations::Create${ModelName})
    field(:update_${model_name}, mutation: Mutations::Update${ModelName})
        `}
      />
      <div></div>
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
