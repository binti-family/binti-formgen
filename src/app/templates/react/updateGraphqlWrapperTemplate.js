export default `import { gql, useMutation, useQuery } from "@apollo/client";
import { Actions, LoadingOverlay, SurfaceForm } from "@heart/components";
import useBintiForm from "@heart/components/forms/useBintiForm";
import _ from "lodash";

import { translationWithRoot } from "@components/T";

import BintiPropTypes from "@lib/BintiPropTypes";
import preventDefault from "@lib/preventDefault";

import {ModelName}Form from "./{ModelName}Form";

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
      \${{ModelName}Fragment}
      query Update{ModelName}($id: ID!) {
        {modelName}(id: $id) {
          ...{ModelName}
        }
      }
    \`,
    {
      variables: { id },
    }
  );

  const [update{ModelName}, { loading: mutationLoading }] = useMutation(
    gql\`
      \${{ModelName}Fragment}
      mutation Update{ModelName}($input: Update{ModelName}Input!) {
        update{ModelName}(input: $input) {
          {modelName} {
            ...{ModelName}
          }
        }
      }
    \`
  );

  const { formState, setFormAttribute } = useBintiForm(data?.{modelName});

  const onSubmit = preventDefault(() =>
    update{ModelName}({
      variables: {
        input: {
          ..._.omit(formState, "__typename"),
        },
      },
    })
  );

  return (
    <LoadingOverlay active={loading || mutationLoading}>
      <SurfaceForm
        title={t("title")}
        actions={<Actions />}
        onSubmit={onSubmit}
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
