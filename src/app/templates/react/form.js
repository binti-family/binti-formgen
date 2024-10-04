export default `import { Flex, InputText, InputDate, InputCheckbox } from "@heart/components";
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
