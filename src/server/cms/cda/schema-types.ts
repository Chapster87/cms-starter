import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  Kind,
} from "graphql"

export const GraphQLJSON = new GraphQLScalarType({
  name: "JSON",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING || ast.kind === Kind.BOOLEAN) return ast.value
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT)
      return parseFloat(ast.value)
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null)
      ast.fields.forEach((field) => {
        value[field.name.value] = field.value
      })
      return value
    }
    if (ast.kind === Kind.LIST) return ast.values.map((val) => val)
    return null
  },
})

export const MediaType = new GraphQLObjectType({
  name: "Media",
  fields: {
    id: { type: GraphQLString },
    url: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    size: { type: GraphQLInt },
    width: { type: GraphQLInt },
    height: { type: GraphQLInt },
    alt_text: { type: GraphQLString },
    folder: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
  },
})
