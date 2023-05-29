import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });

      if (!user) throw fastify.httpErrors.notFound();

      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return fastify.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!id) throw fastify.httpErrors.badRequest();

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (!user) {
        throw fastify.httpErrors.badRequest();
      } else {
        try {
          const users = await fastify.db.users.findMany();

          users.forEach(async (user) => {
            if (user.subscribedToUserIds.includes(id)) {
              const newSubscribed = user.subscribedToUserIds.filter(
                (includedId) => includedId !== id
              );

              await fastify.db.users.change(user.id, {
                subscribedToUserIds: newSubscribed,
              });
            }
          });

          const profiles = await fastify.db.profiles.findMany();
          profiles.forEach(async (profile) => {
            if (profile.userId === id)
              await fastify.db.profiles.delete(profile.id);
          });

          const posts = await fastify.db.posts.findMany();
          posts.forEach(async (post) => {
            if (post.userId === id) await fastify.db.posts.delete(post.id);
          });
        } catch {
          throw fastify.httpErrors.badRequest();
        }
      }

      return fastify.db.users.delete(id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const {
        params: { id },
        body: { userId },
      } = request;

      if (!id) throw fastify.httpErrors.notFound();

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (!user) throw fastify.httpErrors.badRequest();

      let { subscribedToUserIds } = user;
      if (!subscribedToUserIds.includes(id)) {
        const newSubscribedToUserIds = [...subscribedToUserIds, id];

        return fastify.db.users.change(userId, {
          subscribedToUserIds: newSubscribedToUserIds,
        });
      } else {
        throw fastify.httpErrors.badRequest();
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const {
        body: { userId },
        params: { id },
      } = request;

      if (!userId) throw fastify.httpErrors.badRequest();

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (!user) throw fastify.httpErrors.badRequest();

      let { subscribedToUserIds } = user;

      if (subscribedToUserIds.includes(id)) {
        const newSubscribedToUserIds = subscribedToUserIds.filter(
          (included) => included !== id
        );

        return fastify.db.users.change(userId, {
          subscribedToUserIds: newSubscribedToUserIds,
        });
      } else {
        throw fastify.httpErrors.badRequest();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body, params } = request;

      if (
        !(body instanceof Object) ||
        !(
          'firstName' in body ||
          'lastName' in body ||
          'email' in body ||
          'subscribedToUsersIds' in body
        )
      )
        throw fastify.httpErrors.badRequest();

      return fastify.db.users.change(params.id, body);
    }
  );
};

export default plugin;
