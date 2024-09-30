export default `
module Mutations
  class Update{ModelName} < Mutations::BaseMutation
    {arguments}

    # response field
    field(:{model_name}, Types::{ModelName}, null: false)

    def resolve(**args)
      authorize(policy_scope(::{ModelName}).find(args[:id]), :update?)

      result = Services::{ModelName}s::Update.call(**args)

      resultBody = result.body[:{model_name}]

      { {model_name}: }

    rescue ActiveRecord::RecordInvalid => e
      Honeybadger.notify(e)
      raise GraphQL::ExecutionError, "Invalid Record: #{e.message}"
    end
  end
end

`;
