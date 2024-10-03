export default `# typed: true

module Mutations
  class Delete{ModelName} < Mutations::BaseMutation
    {arguments}

    field(:{model_name}, ID, null: false)

    def resolve(id:)
      {mode_name} = policy_scope({ModelName}).find(id)
      authorize({mode_name}, :destroy?)

      ::TransactionRetrier.retry { {mode_name}.destroy! }

      { role_id: role_id }

    rescue ActiveRecord::DeleteRestrictionError
      raise GraphQL::ExecutionError, "Invalid Operation"
    end
  end
end
`;
