export default `module Queries
  class {ModelName} < BaseQuery
    field(:{model_name})
    type(Types::{ModelName})

    description("A generated query for {ModelName}")

    argument(:id, ID, required: true)

    query do |id:|
      authorized_via_policy_scope
      policy_scope(::{ModelName}).find(id)
    end
  end
end

`;
