export default `
module Mutations
  class Update{ModelName} < Mutations::BaseMutation
    argument(:id, ID, required: true)
    {arguments}

    # response field
    field(:{model_name}, Types::{ModelName}, null: false)

    def resolve(**args)
      {model_name} = policy_scope(::{ModelName}).find(args[:id])
      authorize({model_name}, :update?)

      result = Services::{ModelName}s::Update.call({model_name}:, params: args)

      { {model_name}: result.body[:{model_name}] }

    rescue ActiveRecord::RecordInvalid => e
      Honeybadger.notify(e)
      raise GraphQL::ExecutionError, "Invalid Record: #{e.message}"
    end
  end
end

`;
