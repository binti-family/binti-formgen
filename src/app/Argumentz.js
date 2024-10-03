"use client";

import { useFieldArray } from "react-hook-form";
import reactInputTextTemplate from "./templates/react/inputs/text";
import reactInputDateTemplate from "./templates/react/inputs/date";
import reactInputCheckboxTemplate from "./templates/react/inputs/checkbox";

const inputTypesToTemplates = {
  String: reactInputTextTemplate,
  "GraphQL::Types::ISO8601Date": reactInputDateTemplate,
  Boolean: reactInputCheckboxTemplate,
  Integer: reactInputTextTemplate,
};

export default function Argumentz({ control, register }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "argumentz",
  });

  return (
    <>
      {fields.map((argument, index) => (
        <div
          key={`${argument.name}-${argument.type}`}
          style={{ display: "flex", gap: "5px" }}
        >
          <input
            type="text"
            placeholder={`argument_${index}_name`}
            autoFocus
            {...register(`argumentz.${index}.name`)}
          />
          <select
            placeholder={`Argument ${index} type`}
            {...register(`argumentz.${index}.type`)}
          >
            {Object.keys(inputTypesToTemplates).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button onClick={() => remove(index)} tabIndex={-1}>
            X
          </button>
        </div>
      ))}
      <button onClick={() => append({ name: "", type: "String" })}>
        ➕ Add Argument
      </button>
    </>
  );
}
