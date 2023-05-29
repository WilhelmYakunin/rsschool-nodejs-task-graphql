import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
  graphql,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  parse,
  validate,
} from 'graphql';

import {
  allByIdType,
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
  // usersWithAllDataType,
  // usersWithUserSubscribedToProfileType,
  // usersWithUserSubscribedToType,
  userType,
  userTypeWithAllData,
  userWithSubscribedToUserPostsType,
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
          getAllById: {
            type: allByIdType,
            args: {
              userId: {
                type: new GraphQLNonNull(GraphQLID),
              },
              profileId: {
                type: new GraphQLNonNull(GraphQLID),
              },
              postId: {
                type: new GraphQLNonNull(GraphQLID),
              },
              memberTypeId: {
                type: new GraphQLNonNull(GraphQLID),
              },
            },
            resolve: async (_source, args) => {
              const result = new DataLoader(async () => {
                const { userId, profileId, postId, memberTypeId } = args;

                const users = await fastify.db.users.findOne({
                  key: 'id',
                  equals: userId,
                });

                const profiles = await fastify.db.profiles.findOne({
                  key: 'id',
                  equals: profileId,
                });

                const posts = await fastify.db.posts.findOne({
                  key: 'id',
                  equals: postId,
                });

                const memberTypes = await fastify.db.memberTypes.findOne({
                  key: 'id',
                  equals: memberTypeId,
                });

                return [{ users, profiles, posts, memberTypes }];
              });

              return result.load(query);
            },
          },
          getUser: {
            type: userTypeWithAllData,
            args: {
              id: {
                type: new GraphQLNonNull(GraphQLID),
              },
            },
            resolve: async (source, { userId }) => {
              const result = new DataLoader(async () => {
                const user = await fastify.db.users.findOne({
                  key: 'id',
                  equals: userId,
                });

                const profile = await fastify.db.profiles.findOne({
                  key: 'userId',
                  equals: userId,
                });

                const posts = await fastify.db.posts.findOne({
                  key: 'userId',
                  equals: userId,
                });

                const memberType = await fastify.db.memberTypes.findOne({
                  key: 'id',
                  equals: userId,
                });

                return [{ user, profile, posts, memberType }];
              });

              return result.load(query);
            },
          },
          getUserSubscribedPosts: {
            type: userWithSubscribedToUserPostsType,
            args: {
              id: {
                type: new GraphQLNonNull(GraphQLID),
              },
            },
            resolve: async (_source, { userId }) => {
              const result = new DataLoader(async () => {
                const user = await fastify.db.users.findOne({
                  key: 'id',
                  equals: userId,
                });

                const posts = await fastify.db.posts.findOne({
                  key: 'userId',
                  equals: userId,
                });

                if (user) {
                  const { subscribedToUserIds } = user;

                  return [{ user, posts, subscribedToUserIds }];
                }

                throw fastify.httpErrors.badRequest();
              });

              return result.load(query);
            },
          },
          //         getUsersSubscriptions: {
          //           type: usersWithUserSubscribedToType,
          //           resolve: async (source, { userId }) => {

          //             const users = await fastify.db.users.findMany();
          // const usersSubscriptions = await Promise.all(
          //   users.map(async (user) => {
          //     const userSubscribedTo = await fastify.db.users.findMany({
          //       key: 'subscribedToUserIds',
          //       inArray: userId,
          //     });
          //     const subscribedToUser = await findSubscribedToUsers(
          //       fastify,
          //       user.subscribedToUserIds
          //     );

          //     let userSubscribedToNew = [...userSubscribedTo];
          //     let subscribedToUserNew = [...subscribedToUser];

          //     if (level > 1) {
          //       userSubscribedToNew = await getUserSubsciptions(
          //         fastify,
          //         userSubscribedTo,
          //         level - 1
          //       );
          //       subscribedToUserNew = await getUserSubsciptions(
          //         fastify,
          //         subscribedToUser,
          //         level - 1
          //       );
          //     }
          //     return { ...user, userSubscribedToNew, subscribedToUserNew };
          //   })
          // );

          // return { users: usersSubscriptions };
          //           }
          //         },
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
            resolve: async (source, { data }) => {
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
