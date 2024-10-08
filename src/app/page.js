"use client";

import { useForm, useWatch } from "react-hook-form";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Files from "./components/Files";
import Argumentz from "./components/Argumentz";
import { toCamelCase } from "./utils";
import { useEffect } from "react";
import TextBox from "./components/TextBox";
import generateFiles from "./services/generateFiles";

const zip = new JSZip();

const getQueryParameters = () =>
  window.location.search
    .replace("?", "")
    .split("&")
    .map((param) => param.split("="))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

const generateZip = (model_name, argumentz) => {
  generateFiles({ model_name, argumentz }).forEach((file) =>
    zip.file(file.path, file.contents)
  );
  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `${model_name}.zip`);
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
    url.search = `modelName=${model_name}&arguments=${JSON.stringify(
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
      const argumentz = importString
        .split(/\n+/)
        .map((arg) => arg.split(/\s*:/))
        .map((pair) => pair.map((str) => str.trim()));
      setValue(
        "argumentz",
        argumentz.map(([name, type = ""]) => ({
          name,
          type: type.includes("string")
            ? "String"
            : type.includes("date")
            ? "GraphQL::Types::ISO8601Date"
            : type.includes("bool")
            ? "Boolean"
            : "Integer",
        }))
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
        <button onClick={() => generateZip(model_name, argumentz)}>
          💾 Download Zip
        </button>
        <button onClick={clearForm}>🗑️ Clear Form</button>
        <button onClick={showImportModal}>📤 Import</button>
      </div>
      <TextBox title="Line to add to app/graphql/types/query_type.rb">{`query(Queries::${ModelName})`}</TextBox>
      <TextBox title="Lines to add to app/graphql/types/mutation_type.rb">
        {`field(:create_${model_name}, mutation: Mutations::Create${ModelName})
    field(:update_${model_name}, mutation: Mutations::Update${ModelName})
    field(:delete_${model_name}, mutation: Mutations::Delete${ModelName})`}
      </TextBox>
      <Files model_name={model_name} argumentz={argumentz} />
    </div>
  );
}
