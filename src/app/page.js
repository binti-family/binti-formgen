"use client";
import { range } from "ramda";
import { useState } from "react";
import { useForm } from "react-hook-form";
import tagger from "./tagger";

const mutationArgumentTemplate =
  "argument(:{argumentName}, {argumentType}, required: false)";

const createMutationTemplate = `
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

const updateMutationTemplate = `
module Mutations
  class Update{ModelName} < Mutations::BaseMutation
    {arguments}

    # response field
    field(:{model_name}, Types::{ModelName}, null: false)

    def resolve(**args)
      authorize(policy_scope(::{ModelName}).find(args[:id]), :update?)

      result = Services::{ModelName}s::Update.call(**args)

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

const reactCreateGraphqlWrapperTemplate = `import { gql, useMutation } from "@apollo/client";
import { Actions, LoadingOverlay, SurfaceForm } from "@heart/components";
import useBintiForm from "@heart/components/forms/useBintiForm";
import _ from "lodash";
import {ModelName}Form from "./{ModelName}Form";

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

const reactUpdateGraphqlWrapperTemplate = `import { gql, useMutation, useQuery } from "@apollo/client";
import { Actions, LoadingOverlay, SurfaceForm } from "@heart/components";
import useBintiForm from "@heart/components/forms/useBintiForm";
import _ from "lodash";
import { useState } from "react";

import BintiPropTypes from "@lib/BintiPropTypes";
import preventDefault from "@lib/preventDefault";

import {ModelName}Form from "./{ModelName}Form";

import { translationWithRoot } from "@components/T";

const { t } = translationWithRoot("{model_name}");

const {ModelName}Fragment = gql\`
  fragment {ModelName} on {ModelName} {
    id
    {argumentNames}
  }
\`;

const Update{ModelName} = ({ id }) => {
  const { data, loading } = useQuery(
    gql\`
      \${{modelName}Fragment}
      query Update{ModelName}($id: ID!) {
        {modelName}(id: $id) {
          ..{ModelName}
        }
      }
    \`,
    {
      variables: { id },
    }
  );

  const [update{ModelName}, { loading: mutationLoading }] = useMutation(
    gql\`
      \${{modelName}Fragment}
      mutation Update{ModelName}($input: Update{ModelName}Input!) {
        update{ModelName}(input: $input) {
          {modelName} {
            ..{ModelName}
          }
        }
      }
    \`
  );

  const { formState, setFormAttribute } = useBintiForm(data?.{modelName});

  return (
    <LoadingOverlay active={loading || mutationLoading}>
      <SurfaceForm
        title={t("title")}
        actions={<Actions />}
        onSubmit={preventDefault(() =>
          update{ModelName}({
            variables: {
              input: {
                ..._.omit(formState, "__typename"),
              },
            },
          })
        )}
      >
        <{ModelName}Form
          id={id}
          formState={formState}
          setFormAttribute={setFormAttribute}
        />
      </SurfaceForm>
    </LoadingOverlay>
  );
};

Update{ModelName}.propTypes = {
  id: BintiPropTypes.ID,
};

export default Update{ModelName};
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
  const [createMutation, setCreateMutation] = useState("");
  const [updateMutation, setUpdateMutation] = useState("");
  const [argumentCount, setArgumentCount] = useState(1);
  const [modelType, setModelType] = useState("");
  const [reactForm, setReactForm] = useState("");
  const [reactCreateGraphqlWrapper, setReactCreateGraphqlWrapper] =
    useState("");
  const [reactUpdateGraphqlWrapper, setReactUpdateGraphqlWrapper] =
    useState("");

  const { register, handleSubmit } = useForm();

  const onSubmit = (formData) => {
    formData = {
      ...formData,
      ModelName:
        formData.modelName.charAt(0).toUpperCase() +
        formData.modelName.slice(1),
      model_name: toSnakeCase(formData.modelName),
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
      reactInputs: buildArguments(
        argumentCount,
        formData,
        reactInputTextTemplate,
        "    "
      ),
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
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
      <div>Create Mutation Template:</div>
      <textarea style={textAreaStyle} value={createMutation} readOnly />
      <div>Update Mutation Template:</div>
      <textarea style={textAreaStyle} value={updateMutation} readOnly />
      <div>Model Type:</div>
      <textarea style={textAreaStyle} value={modelType} readOnly />
      <div>React Form:</div>
      <textarea style={textAreaStyle} value={reactForm} readOnly />
      <div>React GraphQL Create Wrapper:</div>
      <textarea
        style={textAreaStyle}
        value={reactCreateGraphqlWrapper}
        readOnly
      />
      <div>React GraphQL Update Wrapper:</div>
      <textarea
        style={textAreaStyle}
        value={reactUpdateGraphqlWrapper}
        readOnly
      />
    </>
  );
}
