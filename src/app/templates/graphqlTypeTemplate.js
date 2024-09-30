export default `
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
