import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
  graphql,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  parse,
  validate,
} from 'graphql';

import {
  allType,
  ChangeMemberTypeInputDTO,
  ChangePostInputDTO,
  ChangeProfileInputDTO,
  ChangeUserInputDTO,
  graphqlBodySchema,
  memberType,
  PostInputDTO,
  postType,
  ProfileInputDTO,
  profileType,
  SubscribeInputDTO,
  UserInputDTO,
  userType,
} from './schema';

import DataLoader from 'dataloader';
import depthLimit from 'graphql-depth-limit';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
        validationRules: [depthLimit(1)],
      },
    },
    async function (request, _reply) {
      const { query, variables } = request.body;

      if (!query) return fastify.httpErrors.badRequest();

      const queryType = new GraphQLObjectType({
        name: 'queryType',
        fields: () => ({
          getAll: {
            type: allType,
            resolve: async () => {
              const result = new DataLoader(async () => {
                const users = await fastify.db.users.findMany();
                const profiles = await fastify.db.profiles.findMany();
                const posts = await fastify.db.posts.findMany();
                const memberTypes = await fastify.db.memberTypes.findMany();

                return [{ users, profiles, posts, memberTypes }];
              });

              return result.load(query);
            },
          },
        }),
      });

      const mutationType = new GraphQLObjectType({
        name: 'mutationType',
        fields: () => ({
          createUser: {
            type: userType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(UserInputDTO),
              },
            },
            resolve: async (_source, { data }) =>
              new DataLoader(async () => [fastify.db.users.create(data)]).load(
                query
              ),
          },
          createProfile: {
            type: profileType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(ProfileInputDTO),
              },
            },
            resolve: async (_source, { data }) =>
              new DataLoader(async () => [
                fastify.db.profiles.create(data),
              ]).load(query),
          },
          createPost: {
            type: postType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(PostInputDTO),
              },
            },
            resolve: async (_source, { data }) =>
              new DataLoader(async () => [fastify.db.posts.create(data)]).load(
                query
              ),
          },
          updateUser: {
            type: userType,
            args: {
              data: {
                name: 'data',
                type: ChangeUserInputDTO,
              },
            },
            resolve: async (_source, { data }) => {
              const { id, ...rest } = data;

              return new DataLoader(async () => [
                fastify.db.users.change(id, rest),
              ]).load(query);
            },
          },
          updateProfile: {
            type: profileType,
            args: {
              data: {
                name: 'data',
                type: ChangeProfileInputDTO,
              },
            },
            resolve: async (_source, { data }) => {
              const { id, ...rest } = data;

              return new DataLoader(async () => [
                fastify.db.profiles.change(id, rest),
              ]).load(query);
            },
          },
          updatePost: {
            type: postType,
            args: {
              data: {
                name: 'data',
                type: ChangePostInputDTO,
              },
            },
            resolve: async (_source, { data }) => {
              const { id, ...rest } = data;

              return new DataLoader(async () => [
                fastify.db.posts.change(id, rest),
              ]).load(query);
            },
          },
          updateMemberType: {
            type: memberType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(ChangeMemberTypeInputDTO),
              },
            },
            resolve: async (_source, { data }) => {
              const { id, ...rest } = data;

              return new DataLoader(async () => [
                fastify.db.memberTypes.change(id, rest),
              ]).load(query);
            },
          },
          subscribeTo: {
            type: userType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(SubscribeInputDTO),
              },
            },
            resolve: async (_source, { data }) => {
              const { id, userId } = data;

              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: userId,
              });

              if (user) {
                const { subscribedToUserIds } = user;

                if (!subscribedToUserIds.includes(id)) {
                  const newSubs = [...subscribedToUserIds, id];

                  return new DataLoader(async () => [
                    fastify.db.users.change(userId, {
                      subscribedToUserIds: newSubs,
                    }),
                  ]).load(query);
                }
              }
              throw fastify.httpErrors.badRequest();
            },
          },
          unsubscribeFrom: {
            type: userType,
            args: {
              data: {
                name: 'data',
                type: new GraphQLNonNull(SubscribeInputDTO),
              },
            },
            resolve: async (_source, { data }) => {
              const { id, userId } = data;

              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: userId,
              });

              if (user) {
                const { subscribedToUserIds } = user;

                if (subscribedToUserIds.includes(id)) {
                  const newSubs = subscribedToUserIds.filter(
                    (included) => included !== id
                  );
                  return new DataLoader(async () => [
                    fastify.db.users.change(userId, {
                      subscribedToUserIds: newSubs,
                    }),
                  ]).load(query);
                }
              }
              throw fastify.httpErrors.badRequest();
            },
          },
        }),
      });

      const schema = new GraphQLSchema({
        query: queryType,
        mutation: mutationType,
      });

      const maxDepth: number = 6;

      const isError = validate(schema, parse(query), [depthLimit(maxDepth)]);
      if (isError.length)
        throw fastify.httpErrors.badRequest('Query is more than' + maxDepth);

      return await graphql({
        schema,
        source: query,
        variableValues: variables,
      });
    }
  );
};

export default plugin;
