export default `import { gql, useMutation } from "@apollo/client";
import { Actions, LoadingOverlay, SurfaceForm } from "@heart/components";
import useBintiForm from "@heart/components/forms/useBintiForm";
import _ from "lodash";
import {ModelName}Form from "./{ModelName}Form";

import { translationWithRoot } from "@components/T";

import preventDefault from "@lib/preventDefault";

const { t } = translationWithRoot("{model_name}s");

const initialFormState = {};

const Create{ModelName}Mutation = gql\`
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

  const [create{ModelName}, { loading }] = useMutation(Create{ModelName}Mutation);

  const onSubmit = preventDefault(() =>
    create{ModelName}({
      variables: {
        input: {
          ..._.omit(formState, "__typename"),
        },
      },
    })
  );

  return (
    <LoadingOverlay active={loading}>
      <SurfaceForm
        title={t("title")}
        actions={<Actions />}
        onSubmit={onSubmit}
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
