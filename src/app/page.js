"use client";

import { useForm, useWatch } from "react-hook-form";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Files from "./components/Files";
import Argumentz from "./components/Argumentz";
import { toCamelCase } from "./utils";
import { useEffect } from "react";
import TextBox from "./components/TextBox";

const zip = new JSZip();

const getQueryParameters = () =>
  window.location.search
    .replace("?", "")
    .split("&")
    .map((param) => param.split("="))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

const generateZip = (files) => {
  files.forEach((file) => zip.file(file.path, file.contents));
  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, "binti-formgen.zip");
  });
};

export default function Home() {
  const queryParameters = getQueryParameters();
  const initialArguments = JSON.parse(
    unescape(queryParameters.arguments || "[]")
  );

  const { register, control, setValue } = useForm({
    defaultValues: {
      model_name: queryParameters.modelName || "",
      argumentz: initialArguments,
    },
  });

  const { model_name } = useWatch({ control });
  const argumentz = useWatch({ control, name: "argumentz" }) || [];

  const modelName = toCamelCase(model_name || "");
  const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = `modelName=${modelName}&arguments=${JSON.stringify(
      argumentz
    )}`;
    window.history.pushState({}, "", url);
  }, [modelName, argumentz]);

  const clearForm = () => {
    if (confirm("You sure about that? 🤔")) {
      setValue("model_name", "");
      setValue("argumentz", []);
    }
  };

  const showImportModal = () => {
    const importString = prompt("Paste the import string here");
    if (importString) {
      const argumentNamez = importString.split(/\s+/);
      setValue(
        "argumentz",
        argumentNamez.map((name) => ({ name, type: "String" }))
      );
    }
  };

  return (
    <div
      style={{
        margin: "5px",
        display: "flex",
        gap: "5px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <div>
        <input
          type="text"
          placeholder="model_name"
          {...register("model_name")}
        />
        <span muted>(use snake_case for all inputs)</span>
      </div>
      <Argumentz control={control} register={register} />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          gap: "20px",
          width: "700px",
        }}
      >
        <button onClick={generateZip}>💾 Download Zip</button>
        <button onClick={clearForm}>🗑️ Clear Form</button>
        <button onClick={showImportModal}>📤 Import</button>
      </div>
      <TextBox title="Line to add to app/graphql/types/query_type.rb">{`query(Queries::${ModelName})`}</TextBox>
      <TextBox title="Lines to add to app/graphql/types/mutation_type.rb">
        {`field(:create_${model_name}, mutation: Mutations::Create${ModelName})
    field(:update_${model_name}, mutation: Mutations::Update${ModelName})`}
      </TextBox>
      <Files model_name={model_name} argumentz={argumentz} />
    </div>
  );
}
