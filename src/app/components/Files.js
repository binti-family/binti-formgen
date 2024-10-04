"use client";

import PropTypes from "prop-types";
import TextBox from "./TextBox";
import generateFiles from "../services/generateFiles";

const Files = ({ model_name, argumentz }) => {
  return (
    <>
      {generateFiles({ model_name, argumentz }).map((file) => (
        <TextBox title={file.title} subTitle={`path: ${file.path}`}>
          {file.contents}
        </TextBox>
      ))}
    </>
  );
};

Files.propTypes = {
  model_name: PropTypes.string,
  argumentz: PropTypes.array,
};

export default Files;
