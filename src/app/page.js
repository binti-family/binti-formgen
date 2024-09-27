"use client";
import { range } from "ramda";
import { useState } from "react";
import { useForm } from "react-hook-form";
import tagger from "./tagger";

const formTemplate = `
`;

const mutationArgumentTemplate =
  "argument(:{argumentName}, {argumentType}, required: false)";

const mutationTemplate = `
module Mutations
  class Create{ModelName} < Mutations::BaseMutation
    {arguments}

    # response field
    field(:{model_name}, Types::{ModelName}, null: false)

    def resolve(**args)
      authorize(policy_scope(::{ModelName}).find(args[:id]), :create?)

      result = Services::{ModelName}s::Create.call(**args)

      resultBody = result.body[:{model_name}]

      { {model_name}: }

    rescue ActiveRecord::RecordInvalid => e
      Honeybadger.notify(e)
      raise GraphQL::ExecutionError, "Invalid Record: #{e.message}"
    end
  end
end
`;

const graphqlFieldTemplate = `field(:{argumentName}, Types::{argumentType}, null: true)`;

const graphqlTypeTemplate = `
# typed: strict

module Types
  class {ModelName} < BaseObject
    implements(Types::RailsModelInterface)

    description("A generated type for {model_name}")
    field(:id, ID, null: true)
    {fields}
  end
end
`;

const reactInputTextTemplate = `<InputText
      label={t("{argument_name}")}
      value={formState.{argumentName}}
      onChange={setFormAttribute("{argumentName}")}
    />
`;

const reactFormComponentTemplate = `import { Flex, InputText } from "@heart/components";
import PropTypes from "prop-types";

import { translationWithRoot } from "@components/T";

const { t } = translationWithRoot("{model_name}");

const {ModelName}Form = ({ formState, setFormAttribute }) => (
  <Flex column>
    {reactInputs}
  </Flex>
);

{ModelName}Form.propTypes = {
  formState: PropTypes.object,
  setFormAttribute: PropTypes.func,
};

export default {ModelName}Form;
`;

const reactFormGraphqlWrapperTemplate = `import { gql, useMutation } from "@apollo/client";
import { Actions, LoadingOverlay, SurfaceForm } from "@heart/components";
import useBintiForm from "@heart/components/forms/useBintiForm";
import _ from "lodash";

import { translationWithRoot } from "@components/T";

import preventDefault from "@lib/preventDefault";

const { t } = translationWithRoot("{model_name}");

const initialFormState = {};

const create{ModelName}Mutation = gql\`
  mutation Create{ModelName}($input: Create{ModelName}Input!) {
    create{ModelName}(input: $input) {
      {modelName} {
        id
      }
    }
  }
\`;

const Create{ModelName} = () => {
  const { formState, setFormAttribute } = useBintiForm(initialFormState);

  const [create{ModelName}, { loading }] = useMutation(create{ModelName}Mutation);

  return (
    <LoadingOverlay active={loading}>
      <SurfaceForm
        title={t("{model_name}.title")}
        actions={<Actions />}
        onSubmit={preventDefault(() =>
          create{ModelName}({
            variables: {
              input: {
                ..._.omit(formState, "__typename"),
              },
            },
          })
        )}
      >
        <{ModelName}Form
          formState={formState}
          setFormAttribute={setFormAttribute}
        />
      </SurfaceForm>
    </LoadingOverlay>
  );
};

Create{ModelName}.propTypes = {};

export default Create{ModelName};
`;

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

export default function Home() {
  const [template, setTemplate] = useState("");
  const [mutation, setMutation] = useState("");
  const [argumentCount, setArgumentCount] = useState(1);
  const [modelType, setModelType] = useState("");
  const [reactForm, setReactForm] = useState("");
  const [reactGraphqlWrapper, setReactGraphqlWrapper] = useState("");

  const { register, handleSubmit } = useForm();

  const onSubmit = (formData) => {
    formData = {
      ...formData,
      ModelName:
        formData.modelName.charAt(0).toUpperCase() +
        formData.modelName.slice(1),
      model_name: toSnakeCase(formData.modelName),
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
      reactInputs: buildArguments(
        argumentCount,
        formData,
        reactInputTextTemplate,
        "    "
      ),
    };

    setTemplate(tagger(formData, formTemplate));
    setMutation(tagger(formData, mutationTemplate));
    setModelType(tagger(formData, graphqlTypeTemplate));
    setReactForm(tagger(formData, reactFormComponentTemplate));
    setReactGraphqlWrapper(tagger(formData, reactFormGraphqlWrapperTemplate));
  };

  const textAreaStyle = { height: "500px", width: "700px" };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          placeholder="Model name"
          {...register("modelName")}
          value="TestModel"
        />
        {range(0, argumentCount).map((index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Argument ${index} name`}
              {...register(`argument${index}Name`)}
            />
            <input
              type="text"
              placeholder={`Argument ${index} type`}
              {...register(`argument${index}Type`)}
            />
          </div>
        ))}
        <button onClick={() => setArgumentCount(argumentCount + 1)}>
          Add Argument
        </button>
        <button type="submit">Submit</button>
      </form>
      {/* <div>Form Template:</div>
      <div>{template}</div> */}
      <div>Mutation Template:</div>
      <textarea style={textAreaStyle} value={mutation} readOnly />
      <div>Model Type:</div>
      <textarea style={textAreaStyle} value={modelType} readOnly />
      <div>React Form:</div>
      <textarea style={textAreaStyle} value={reactForm} readOnly />
      <div>React GraphQL Create Wrapper:</div>
      <textarea style={textAreaStyle} value={reactGraphqlWrapper} readOnly />
    </>
  );
}
