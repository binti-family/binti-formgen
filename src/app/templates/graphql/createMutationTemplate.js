export default `
module Mutations
  class Create{ModelName} < Mutations::BaseMutation
    {arguments}

    # response field
    field(:{model_name}, Types::{ModelName}, null: false)

    def resolve()
      authorize(::{ModelName}, :create?)

      result = Services::{ModelName}s::Create.call(**args)

      { {model_name}: result.body[:{model_name}] }

    rescue ActiveRecord::RecordInvalid => e
      Honeybadger.notify(e)
      raise GraphQL::ExecutionError, "Invalid Record: #{e.message}"
    end
  end
end

`;
