"use client";
import { useForm, useWatch } from "react-hook-form";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Files from "./Files";
import Argumentz from "./Argumentz";
import { toCamelCase } from "./utils";

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

  const { register, control } = useForm({
    defaultValues: {
      model_name: queryParameters.modelName || "",
      argumentz: initialArguments,
    },
  });

  const { model_name } = useWatch({ control });
  const argumentz = useWatch({ control, name: "argumentz" }) || [];

  const modelName = toCamelCase(model_name || "");
  const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  const url = new URL(window.location.href);
  url.search = `modelName=${modelName}&arguments=${JSON.stringify(argumentz)}`;
  window.history.pushState({}, "", url);

  return (
    <>
      <div
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
        <Argumentz control={control} register={register} />
        <button onClick={generateZip}> Download Zip </button>
      </div>
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
      <Files model_name={model_name} argumentz={argumentz} />
    </>
  );
}
