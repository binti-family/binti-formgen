export default `module Mutations
  class Delete{ModelName} < Mutations::BaseMutation
    argument(:id, ID, required: true)

    field(:{model_name}, ID, null: false)

    def resolve(id:)
      {model_name} = policy_scope({ModelName}).find(id)
      authorize({model_name}, :destroy?)

      ::TransactionRetrier.retry { {model_name}.destroy! }

      { {model_name}: {model_name} }

    rescue ActiveRecord::DeleteRestrictionError
      raise GraphQL::ExecutionError, "Invalid Operation"
    end
  end
end
`;
